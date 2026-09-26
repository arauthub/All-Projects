import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../../app.js';
import { FastifyInstance } from 'fastify';
import prisma from '../../db/prisma.js';
import { storageService } from '../../services/storage.service.js';
import { Role, SyncStatus } from '@prisma/client';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';

describe('Resumable Chunked Sync & File Engine', () => {
  let app: FastifyInstance;
  let testUserToken: string;
  const testUserId = 'usr_sync_tester_01';
  const testFamilyId = 'fam_sync_tester_01';

  beforeAll(async () => {
    app = await buildApp();

    testUserToken = app.jwt.sign({
      id: testUserId,
      email: 'synctest@example.com',
      name: 'Sync Tester',
      role: Role.MEMBER,
      familyId: testFamilyId,
    });
  });

  afterAll(async () => {
    // Clean test directories if needed
    const stagingDir = path.join(storageService.getRootPath(), 'staging');
    if (fsSync.existsSync(stagingDir)) {
      await fs.rm(stagingDir, { recursive: true, force: true });
    }
  });

  describe('Delta Sync Determination (/api/v1/sync/status)', () => {
    it('should correctly partition assets into missing and synced', async () => {
      const hashSynced = 'a'.repeat(64);
      const hashMissing = 'b'.repeat(64);

      // Mock existing file with hashSynced
      vi.spyOn(prisma.fileItem, 'findMany').mockResolvedValue([
        { checksumSha256: hashSynced },
      ] as any);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/sync/status',
        headers: {
          authorization: `Bearer ${testUserToken}`,
        },
        payload: {
          assets: [
            {
              localId: 'asset_local_1',
              checksumSha256: hashSynced,
              sizeBytes: 1024,
            },
            {
              localId: 'asset_local_2',
              checksumSha256: hashMissing,
              sizeBytes: 2048,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.syncedAssets).toContain('asset_local_1');
      expect(data.missingAssets).toContain('asset_local_2');
    });
  });

  describe('Resumable Multi-Chunk Upload Flow', () => {
    it('should complete a 3-chunk upload, assemble file, and verify SHA-256', async () => {
      // 1. Prepare simulated file data (3 chunks of 1KB each)
      const chunk1 = Buffer.alloc(1024, 'A');
      const chunk2 = Buffer.alloc(1024, 'B');
      const chunk3 = Buffer.alloc(512, 'C'); // Final partial chunk
      const fullBuffer = Buffer.concat([chunk1, chunk2, chunk3]);
      const fullSha256 = crypto.createHash('sha256').update(fullBuffer).digest('hex');
      const chunk1Sha256 = crypto.createHash('sha256').update(chunk1).digest('hex');
      const chunk2Sha256 = crypto.createHash('sha256').update(chunk2).digest('hex');
      const chunk3Sha256 = crypto.createHash('sha256').update(chunk3).digest('hex');

      const uploadId = '11111111-2222-3333-4444-555555555555';

      // Mock quota check
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: testUserId,
        storageQuotaBytes: BigInt(107374182400),
        usedStorageBytes: BigInt(0),
      } as any);

      // Mock findFirst for deduplication check & session check
      vi.spyOn(prisma.fileItem, 'findFirst').mockResolvedValue(null);
      vi.spyOn(prisma.uploadSession, 'findFirst').mockResolvedValue(null);

      // Mock create UploadSession
      const mockSession = {
        id: uploadId,
        userId: testUserId,
        filename: 'family_vacation.jpg',
        mimeType: 'image/jpeg',
        totalSizeBytes: BigInt(fullBuffer.length),
        chunkSizeBytes: 1024,
        totalChunks: 3,
        uploadedChunks: [],
        expectedSha256: fullSha256,
        status: SyncStatus.UPLOADING,
        expiresAt: new Date(Date.now() + 86400000),
      };

      vi.spyOn(prisma.uploadSession, 'create').mockResolvedValue(mockSession as any);
      vi.spyOn(prisma.uploadSession, 'findUnique').mockResolvedValue(mockSession as any);
      vi.spyOn(prisma.uploadSession, 'update').mockResolvedValue(mockSession as any);
      vi.spyOn(prisma.user, 'update').mockResolvedValue({} as any);
      vi.spyOn(prisma.fileItem, 'create').mockResolvedValue({
        id: 'fil_test_success_123',
        name: 'family_vacation.jpg',
        sizeBytes: BigInt(fullBuffer.length),
        checksumSha256: fullSha256,
        mimeType: 'image/jpeg',
        thumbnailPath: null,
        createdAt: new Date(),
      } as any);

      // Step A: Init Upload
      const initRes = await app.inject({
        method: 'POST',
        url: '/api/v1/sync/upload/init',
        headers: { authorization: `Bearer ${testUserToken}` },
        payload: {
          filename: 'family_vacation.jpg',
          mimeType: 'image/jpeg',
          totalSizeBytes: fullBuffer.length,
          chunkSizeBytes: 1024,
          expectedSha256: fullSha256,
        },
      });

      expect(initRes.statusCode).toBe(201);
      const initData = JSON.parse(initRes.body);
      expect(initData.uploadId).toBe(uploadId);
      expect(initData.totalChunks).toBe(3);

      // Step B: Upload Chunk 0
      const chunk0Res = await app.inject({
        method: 'PUT',
        url: '/api/v1/sync/upload/chunk',
        headers: {
          authorization: `Bearer ${testUserToken}`,
          'content-type': 'application/octet-stream',
          'x-upload-id': uploadId,
          'x-chunk-index': '0',
          'x-chunk-sha256': chunk1Sha256,
        },
        payload: chunk1,
      });
      expect(chunk0Res.statusCode).toBe(200);

      // Step C: Upload Chunk 1
      const chunk1Res = await app.inject({
        method: 'PUT',
        url: '/api/v1/sync/upload/chunk',
        headers: {
          authorization: `Bearer ${testUserToken}`,
          'content-type': 'application/octet-stream',
          'x-upload-id': uploadId,
          'x-chunk-index': '1',
          'x-chunk-sha256': chunk2Sha256,
        },
        payload: chunk2,
      });
      expect(chunk1Res.statusCode).toBe(200);

      // Step D: Upload Chunk 2
      const chunk2Res = await app.inject({
        method: 'PUT',
        url: '/api/v1/sync/upload/chunk',
        headers: {
          authorization: `Bearer ${testUserToken}`,
          'content-type': 'application/octet-stream',
          'x-upload-id': uploadId,
          'x-chunk-index': '2',
          'x-chunk-sha256': chunk3Sha256,
        },
        payload: chunk3,
      });
      expect(chunk2Res.statusCode).toBe(200);

      // Step E: Finalize Upload
      const finalizeRes = await app.inject({
        method: 'POST',
        url: '/api/v1/sync/upload/finalize',
        headers: { authorization: `Bearer ${testUserToken}` },
        payload: { uploadId },
      });

      expect(finalizeRes.statusCode).toBe(201);
      const finalizeData = JSON.parse(finalizeRes.body);
      expect(finalizeData.file.name).toBe('family_vacation.jpg');
      expect(finalizeData.file.checksumSha256).toBe(fullSha256);
    });

    it('should reject a chunk with invalid hash', async () => {
      const uploadId = '22222222-3333-4444-5555-666666666666';
      const chunkData = Buffer.from('Corrupt chunk test data');

      vi.spyOn(prisma.uploadSession, 'findUnique').mockResolvedValue({
        id: uploadId,
        userId: testUserId,
        status: SyncStatus.UPLOADING,
        totalChunks: 2,
        uploadedChunks: [],
      } as any);

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/sync/upload/chunk',
        headers: {
          authorization: `Bearer ${testUserToken}`,
          'content-type': 'application/octet-stream',
          'x-upload-id': uploadId,
          'x-chunk-index': '0',
          'x-chunk-sha256': '0000000000000000000000000000000000000000000000000000000000000000', // Invalid hash
        },
        payload: chunkData,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('checksum mismatch');
    });
  });
});
