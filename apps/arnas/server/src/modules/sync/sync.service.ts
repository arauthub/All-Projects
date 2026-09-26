import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import prisma from '../../db/prisma.js';
import { storageService } from '../../services/storage.service.js';
import { storageOrchestrator } from '../../storage/orchestrator.js';
import { auditService } from '../audit/audit.service.js';
import { familyService } from '../family/family.service.js';
import { UploadInitInput, SyncStatusInput } from './sync.schema.js';
import { SyncStatus } from '@prisma/client';

export class SyncService {
  /**
   * Determine which mobile assets are missing on the server vs already backed up
   */
  public async getSyncStatus(userId: string, familyId: string, input: SyncStatusInput) {
    if (!input.assets || input.assets.length === 0) {
      return { missingAssets: [], syncedAssets: [] };
    }

    const hashes = input.assets.map((a) => a.checksumSha256);

    const existingFiles = await prisma.fileItem.findMany({
      where: {
        isDeleted: false,
        checksumSha256: { in: hashes },
        OR: [
          { userId },
          { familyId, isSharedVault: true },
        ],
      },
      select: { checksumSha256: true },
    });

    const existingHashSet = new Set(existingFiles.map((f) => f.checksumSha256));

    const missingAssets: string[] = [];
    const syncedAssets: string[] = [];

    for (const asset of input.assets) {
      if (existingHashSet.has(asset.checksumSha256)) {
        syncedAssets.push(asset.localId);
      } else {
        missingAssets.push(asset.localId);
      }
    }

    return { missingAssets, syncedAssets };
  }

  /**
   * Initialize a resumable chunked upload session or detect instant deduplication
   */
  public async initUpload(userId: string, familyId: string, deviceId: string | undefined, input: UploadInitInput) {
    // 1. Storage quota check
    await familyService.checkStorageQuota(userId, input.totalSizeBytes);

    // 2. Content Deduplication Check
    const existingFile = await prisma.fileItem.findFirst({
      where: {
        checksumSha256: input.expectedSha256,
        isDeleted: false,
        storagePath: { not: null },
      },
    });

    if (existingFile && existingFile.storagePath) {
      // Create duplicate FileItem pointing to existing disk asset
      const duplicate = await prisma.fileItem.create({
        data: {
          familyId,
          userId,
          parentFolderId: input.parentFolderId || null,
          name: input.filename,
          mimeType: input.mimeType,
          sizeBytes: BigInt(input.totalSizeBytes),
          checksumSha256: input.expectedSha256,
          storagePath: existingFile.storagePath,
          thumbnailPath: existingFile.thumbnailPath,
          isSharedVault: input.isSharedVault,
          takenAt: input.takenAt ? new Date(input.takenAt) : null,
        },
      });

      // Increment user quota
      await prisma.user.update({
        where: { id: userId },
        data: { usedStorageBytes: { increment: BigInt(input.totalSizeBytes) } },
      });

      return {
        status: 'DEDUPLICATED' as const,
        uploadId: null,
        file: {
          id: duplicate.id,
          name: duplicate.name,
          sizeBytes: duplicate.sizeBytes.toString(),
          checksumSha256: duplicate.checksumSha256,
        },
      };
    }

    // 3. Check for existing active upload session to support resuming
    const existingSession = await prisma.uploadSession.findFirst({
      where: {
        userId,
        expectedSha256: input.expectedSha256,
        status: SyncStatus.UPLOADING,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingSession) {
      return {
        status: 'RESUMING' as const,
        uploadId: existingSession.id,
        chunkSizeBytes: existingSession.chunkSizeBytes,
        totalChunks: existingSession.totalChunks,
        uploadedChunks: existingSession.uploadedChunks,
        expiresAt: existingSession.expiresAt,
      };
    }

    // 4. Calculate chunks & create session
    const chunkSizeBytes = input.chunkSizeBytes || 2 * 1024 * 1024;
    const totalChunks = Math.ceil(input.totalSizeBytes / chunkSizeBytes);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = await prisma.uploadSession.create({
      data: {
        userId,
        deviceId: deviceId || null,
        filename: input.filename,
        mimeType: input.mimeType,
        totalSizeBytes: BigInt(input.totalSizeBytes),
        chunkSizeBytes,
        totalChunks,
        uploadedChunks: [],
        expectedSha256: input.expectedSha256,
        status: SyncStatus.UPLOADING,
        isEncrypted: input.isEncrypted ?? false,
        encryptionAlgo: input.encryptionAlgo ?? 'AES-256-GCM',
        initializationVector: input.initializationVector || null,
        authTag: input.authTag || null,
        encryptedFileKey: input.encryptedFileKey || null,
        encryptedMetadata: input.encryptedMetadata || null,
        expiresAt,
      },
    });

    // Ensure staging directory exists
    const stagingDir = storageService.getStagingPath(session.id);
    await fs.mkdir(stagingDir, { recursive: true });

    return {
      status: 'INITIATED' as const,
      uploadId: session.id,
      chunkSizeBytes,
      totalChunks,
      uploadedChunks: [],
      expiresAt,
    };
  }

  /**
   * Save a single chunk to staging and verify integrity
   */
  public async saveChunk(
    userId: string,
    uploadId: string,
    chunkIndex: number,
    chunkSha256: string | undefined,
    chunkBuffer: Buffer
  ) {
    const session = await prisma.uploadSession.findUnique({
      where: { id: uploadId },
    });

    if (!session || session.userId !== userId) {
      const error: any = new Error('Upload session not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    if (session.status !== SyncStatus.UPLOADING) {
      const error: any = new Error(`Session is not active (current status: ${session.status})`);
      error.statusCode = 400;
      throw error;
    }

    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      const error: any = new Error(`Invalid chunk index ${chunkIndex}. Total chunks: ${session.totalChunks}`);
      error.statusCode = 400;
      throw error;
    }

    // Verify chunk checksum if provided
    if (chunkSha256) {
      const computedHash = storageService.computeHash(chunkBuffer);
      if (computedHash.toLowerCase() !== chunkSha256.toLowerCase()) {
        const error: any = new Error(`Chunk ${chunkIndex} checksum mismatch.`);
        error.statusCode = 400;
        throw error;
      }
    }

    // Write chunk file to staging
    const stagingDir = storageService.getStagingPath(session.id);
    await fs.mkdir(stagingDir, { recursive: true });

    const chunkFileName = `chunk_${chunkIndex.toString().padStart(5, '0')}.bin`;
    const chunkPath = path.join(stagingDir, chunkFileName);
    await fs.writeFile(chunkPath, chunkBuffer);

    // Update session uploadedChunks if not already included
    if (!session.uploadedChunks.includes(chunkIndex)) {
      await prisma.uploadSession.update({
        where: { id: uploadId },
        data: {
          uploadedChunks: {
            push: chunkIndex,
          },
        },
      });
    }

    return {
      uploadId,
      chunkIndex,
      status: 'ACCEPTED',
      receivedBytes: chunkBuffer.length,
    };
  }

  /**
   * Finalize upload: Assemble all chunks, verify full SHA-256, move to permanent storage, generate thumbnail
   */
  public async finalizeUpload(userId: string, familyId: string, uploadId: string) {
    const session = await prisma.uploadSession.findUnique({
      where: { id: uploadId },
    });

    if (!session || session.userId !== userId) {
      const error: any = new Error('Upload session not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    if (session.status !== SyncStatus.UPLOADING) {
      const error: any = new Error(`Session status is ${session.status}, cannot finalize`);
      error.statusCode = 400;
      throw error;
    }

    const stagingDir = storageService.getStagingPath(session.id);
    const assembledPath = path.join(stagingDir, 'assembled.bin');

    // Verify all chunks exist
    const assembledWriteStream = fsSync.createWriteStream(assembledPath);

    try {
      for (let i = 0; i < session.totalChunks; i++) {
        const chunkFileName = `chunk_${i.toString().padStart(5, '0')}.bin`;
        const chunkPath = path.join(stagingDir, chunkFileName);

        if (!fsSync.existsSync(chunkPath)) {
          const error: any = new Error(`Missing chunk ${i}. Cannot finalize.`);
          error.statusCode = 400;
          throw error;
        }

        const chunkData = await fs.readFile(chunkPath);
        assembledWriteStream.write(chunkData);
      }
    } finally {
      await new Promise<void>((resolve) => {
        assembledWriteStream.end(() => resolve());
      });
    }

    // Verify whole file SHA-256
    const finalSha256 = await storageService.computeFileHash(assembledPath);
    if (finalSha256.toLowerCase() !== session.expectedSha256.toLowerCase()) {
      await fs.rm(stagingDir, { recursive: true, force: true });
      await prisma.uploadSession.update({
        where: { id: uploadId },
        data: { status: SyncStatus.FAILED },
      });

      const error: any = new Error(
        `Final file checksum mismatch. Expected ${session.expectedSha256}, got ${finalSha256}`
      );
      error.statusCode = 400;
      throw error;
    }

    // Determine permanent path on disk
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const ext = path.extname(session.filename) || '';

    const memberMediaDir = path.join(
      storageService.getMemberPath(familyId, userId, 'camera_roll'),
      year,
      month
    );
    await fs.mkdir(memberMediaDir, { recursive: true });

    const finalDiskPath = path.join(memberMediaDir, `${finalSha256}${ext}`);
    await fs.rename(assembledPath, finalDiskPath);

    // Generate WebP Thumbnail only for plaintext images (encrypted images are zero-knowledge ciphertexts)
    let thumbnailRelPath: string | null = null;
    if (!session.isEncrypted) {
      const thumbGenerated = await storageService.generateThumbnail(finalDiskPath, finalSha256, 384);
      if (thumbGenerated) {
        thumbnailRelPath = path.relative(storageService.getRootPath(), thumbGenerated);
      }
    }

    const storageRelPath = path.relative(storageService.getRootPath(), finalDiskPath);

    // Create FileItem record with E2EE fields
    const file = await prisma.fileItem.create({
      data: {
        familyId,
        userId,
        name: session.filename,
        mimeType: session.mimeType,
        sizeBytes: session.totalSizeBytes,
        checksumSha256: finalSha256,
        storagePath: storageRelPath,
        thumbnailPath: thumbnailRelPath,
        isSharedVault: false,
        isEncrypted: session.isEncrypted,
        encryptionAlgo: session.encryptionAlgo,
        initializationVector: session.initializationVector,
        authTag: session.authTag,
        encryptedFileKey: session.encryptedFileKey,
        encryptedMetadata: session.encryptedMetadata,
        createdAt: new Date(),
      },
    });

    // Replicate across enterprise storage cluster (writes primary, enqueues replicas)
    try {
      const finalBuffer = await fs.readFile(finalDiskPath);
      await storageOrchestrator.writeToCluster(storageRelPath, finalBuffer, file.id, session.mimeType || undefined);
    } catch (err: any) {
      console.warn(`[SyncService] Cluster fan-out replication warning for file ${file.id}: ${err.message}`);
    }

    // Record enterprise compliance audit trail
    await auditService.logEvent('FILE_UPLOAD', {
      userId,
      familyId,
      details: {
        fileId: file.id,
        filename: file.name,
        sizeBytes: file.sizeBytes.toString(),
        isEncrypted: file.isEncrypted,
        checksumSha256: file.checksumSha256,
      },
    });

    // Update user quota
    await prisma.user.update({
      where: { id: userId },
      data: { usedStorageBytes: { increment: session.totalSizeBytes } },
    });

    // Mark session completed
    await prisma.uploadSession.update({
      where: { id: uploadId },
      data: { status: SyncStatus.COMPLETED },
    });

    // Cleanup staging folder
    await fs.rm(stagingDir, { recursive: true, force: true });

    return {
      file: {
        id: file.id,
        name: file.name,
        sizeBytes: file.sizeBytes.toString(),
        checksumSha256: file.checksumSha256,
        mimeType: file.mimeType,
        thumbnailUrl: file.thumbnailPath ? `/api/v1/files/${file.id}/thumbnail` : null,
        isEncrypted: file.isEncrypted,
        encryptionAlgo: file.encryptionAlgo,
        initializationVector: file.initializationVector,
        authTag: file.authTag,
        encryptedFileKey: file.encryptedFileKey,
        encryptedMetadata: file.encryptedMetadata,
        createdAt: file.createdAt,
      },
    };
  }
}

export const syncService = new SyncService();
