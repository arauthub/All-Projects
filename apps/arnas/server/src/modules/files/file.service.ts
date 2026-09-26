import path from 'path';
import fsSync from 'fs';
import prisma from '../../db/prisma.js';
import { storageService } from '../../services/storage.service.js';
import { storageOrchestrator } from '../../storage/orchestrator.js';
import { auditService } from '../audit/audit.service.js';
import { FileListQuery } from './file.schema.js';

export class FileService {
  /**
   * List files and folders with pagination and vault filtering
   */
  public async listFiles(userId: string, familyId: string, query: FileListQuery) {
    const isVault = query.vault === true;

    const whereClause: any = {
      isDeleted: false,
      parentFolderId: query.folderId || null,
    };

    if (isVault) {
      whereClause.familyId = familyId;
      whereClause.isSharedVault = true;
    } else {
      whereClause.userId = userId;
      whereClause.isSharedVault = false;
    }

    const [items, total] = await Promise.all([
      prisma.fileItem.findMany({
        where: whereClause,
        orderBy: [{ isDirectory: 'desc' }, { createdAt: 'desc' }],
        take: query.limit,
        skip: query.offset,
      }),
      prisma.fileItem.count({ where: whereClause }),
    ]);

    return {
      total,
      limit: query.limit,
      offset: query.offset,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        isDirectory: item.isDirectory,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes.toString(),
        checksumSha256: item.checksumSha256,
        thumbnailUrl: item.thumbnailPath ? `/api/v1/files/${item.id}/thumbnail` : null,
        isSharedVault: item.isSharedVault,
        isFavorite: item.isFavorite,
        isEncrypted: item.isEncrypted,
        encryptionAlgo: item.encryptionAlgo,
        initializationVector: item.initializationVector,
        authTag: item.authTag,
        encryptedFileKey: item.encryptedFileKey,
        encryptedMetadata: item.encryptedMetadata,
        takenAt: item.takenAt,
        createdAt: item.createdAt,
      })),
    };
  }

  /**
   * Stream file from enterprise storage cluster with automatic replica failover
   */
  public async getFileStreamFromCluster(
    userId: string,
    familyId: string,
    fileId: string,
    range?: { start: number; end: number }
  ) {
    const file = await prisma.fileItem.findUnique({
      where: { id: fileId },
    });

    if (!file || file.isDeleted) {
      const error: any = new Error('File not found');
      error.statusCode = 404;
      throw error;
    }

    const isOwner = file.userId === userId;
    const isSharedInFamily = file.familyId === familyId && file.isSharedVault;

    if (!isOwner && !isSharedInFamily) {
      const error: any = new Error('Access denied to this file');
      error.statusCode = 403;
      throw error;
    }

    if (!file.storagePath) {
      const error: any = new Error('Storage path not set for this file');
      error.statusCode = 404;
      throw error;
    }

    // Read through cluster orchestrator with automatic failover to healthy replicas
    const clusterResult = await storageOrchestrator.readFromCluster(file.id, file.storagePath, range);

    return {
      file,
      stream: clusterResult.stream,
      sourceNodeId: clusterResult.sourceNodeId,
      sourceNodeName: clusterResult.sourceNodeName,
      isFailover: clusterResult.isFailover,
    };
  }

  /**
   * Retrieve file metadata and verify access permissions (for local disk fallback / thumbnails)
   */
  public async getFileForDownload(userId: string, familyId: string, fileId: string) {
    const file = await prisma.fileItem.findUnique({
      where: { id: fileId },
    });

    if (!file || file.isDeleted) {
      const error: any = new Error('File not found');
      error.statusCode = 404;
      throw error;
    }

    // Access control: User owns file OR file is in family shared vault
    const isOwner = file.userId === userId;
    const isSharedInFamily = file.familyId === familyId && file.isSharedVault;

    if (!isOwner && !isSharedInFamily) {
      const error: any = new Error('Access denied to this file');
      error.statusCode = 403;
      throw error;
    }

    if (!file.storagePath) {
      const error: any = new Error('Storage path not set for this file');
      error.statusCode = 404;
      throw error;
    }

    const absolutePath = path.join(storageService.getRootPath(), file.storagePath);
    return { file, absolutePath };
  }

  /**
   * Retrieve thumbnail for an image/video file
   */
  public async getThumbnail(userId: string, familyId: string, fileId: string) {
    const { file } = await this.getFileForDownload(userId, familyId, fileId);

    if (!file.thumbnailPath) {
      const error: any = new Error('Thumbnail not available for this file');
      error.statusCode = 404;
      throw error;
    }

    const absolutePath = path.join(storageService.getRootPath(), file.thumbnailPath);
    if (!fsSync.existsSync(absolutePath)) {
      const error: any = new Error('Thumbnail file missing from storage');
      error.statusCode = 404;
      throw error;
    }

    return { absolutePath, mimeType: 'image/webp' };
  }

  /**
   * Soft delete a file and free up user quota with enterprise audit logging
   */
  public async softDeleteFile(userId: string, familyId: string, fileId: string, isAdmin: boolean) {
    const file = await prisma.fileItem.findUnique({
      where: { id: fileId },
    });

    if (!file || file.isDeleted) {
      const error: any = new Error('File not found');
      error.statusCode = 404;
      throw error;
    }

    if (file.userId !== userId && !isAdmin) {
      const error: any = new Error('Permission denied to delete this file');
      error.statusCode = 403;
      throw error;
    }

    // Soft delete
    await prisma.fileItem.update({
      where: { id: fileId },
      data: { isDeleted: true },
    });

    // Record enterprise compliance audit trail
    await auditService.logEvent('FILE_DELETE', {
      userId,
      familyId,
      details: {
        fileId: file.id,
        filename: file.name,
        sizeBytes: file.sizeBytes.toString(),
      },
    });

    // Decrement user storage usage
    if (file.sizeBytes > BigInt(0)) {
      await prisma.user.update({
        where: { id: file.userId },
        data: {
          usedStorageBytes: {
            decrement: file.sizeBytes,
          },
        },
      });
    }

    return { success: true, id: fileId };
  }
}

export const fileService = new FileService();
