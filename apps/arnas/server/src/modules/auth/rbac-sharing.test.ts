import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../../app.js';
import { FastifyInstance } from 'fastify';
import prisma from '../../db/prisma.js';
import { Role } from '@prisma/client';

describe('Enterprise RBAC & User Content Isolation System', () => {
  let app: FastifyInstance;
  let adminToken: string;
  let userAToken: string;
  let userBToken: string;
  let userCToken: string;

  const adminId = 'usr_admin_rbac';
  const userAId = 'usr_alice_a';
  const userBId = 'usr_bob_b';
  const userCId = 'usr_charlie_c';
  const familyId = 'fam_enterprise_test';

  beforeAll(async () => {
    app = await buildApp();

    // Clean up test data if existing
    await prisma.fileShare.deleteMany({
      where: {
        fileItem: {
          familyId,
        },
      },
    });
    await prisma.fileItem.deleteMany({ where: { familyId } });
    await prisma.user.deleteMany({ where: { familyId } });
    await prisma.family.deleteMany({ where: { id: familyId } });

    // Seed test family
    await prisma.family.create({
      data: {
        id: familyId,
        name: 'Enterprise Isolation Test Family',
      },
    });

    // Seed Admin, User A, User B, User C
    await prisma.user.createMany({
      data: [
        {
          id: adminId,
          email: 'admin.rbac@enterprise.corp',
          name: 'Admin Boss',
          passwordHash: 'fakehash',
          role: Role.ADMIN,
          familyId,
          storageQuotaBytes: BigInt(107374182400),
        },
        {
          id: userAId,
          email: 'alice@enterprise.corp',
          name: 'Alice Member',
          passwordHash: 'fakehash',
          role: Role.MEMBER,
          familyId,
          storageQuotaBytes: BigInt(53687091200),
        },
        {
          id: userBId,
          email: 'bob@enterprise.corp',
          name: 'Bob Member',
          passwordHash: 'fakehash',
          role: Role.MEMBER,
          familyId,
          storageQuotaBytes: BigInt(53687091200),
        },
        {
          id: userCId,
          email: 'charlie@enterprise.corp',
          name: 'Charlie Stranger',
          passwordHash: 'fakehash',
          role: Role.MEMBER,
          familyId,
          storageQuotaBytes: BigInt(53687091200),
        },
      ],
    });

    // Sign JWT tokens
    adminToken = app.jwt.sign({
      id: adminId,
      email: 'admin.rbac@enterprise.corp',
      name: 'Admin Boss',
      role: Role.ADMIN,
      familyId,
    });

    userAToken = app.jwt.sign({
      id: userAId,
      email: 'alice@enterprise.corp',
      name: 'Alice Member',
      role: Role.MEMBER,
      familyId,
    });

    userBToken = app.jwt.sign({
      id: userBId,
      email: 'bob@enterprise.corp',
      name: 'Bob Member',
      role: Role.MEMBER,
      familyId,
    });

    userCToken = app.jwt.sign({
      id: userCId,
      email: 'charlie@enterprise.corp',
      name: 'Charlie Stranger',
      role: Role.MEMBER,
      familyId,
    });
  });

  describe('Storage & Drive Administration Permissions (Admin vs Normal User)', () => {
    it('should forbid normal member from configuring external drives or benchmarks', async () => {
      // Bob tries to mount a drive
      const attachRes = await app.inject({
        method: 'POST',
        url: '/api/v1/storage/external-drives/attach',
        headers: { authorization: `Bearer ${userBToken}` },
        payload: {
          mountPath: '/tmp/rogue_drive',
          name: 'Rogue Drive',
        },
      });
      expect(attachRes.statusCode).toBe(403);

      // Bob tries to benchmark
      const benchRes = await app.inject({
        method: 'POST',
        url: '/api/v1/storage/external-drives/benchmark',
        headers: { authorization: `Bearer ${userBToken}` },
        payload: { mountPath: '/tmp' },
      });
      expect(benchRes.statusCode).toBe(403);

      // Bob tries to simulate a drive
      const simRes = await app.inject({
        method: 'POST',
        url: '/api/v1/storage/external-drives/simulate',
        headers: { authorization: `Bearer ${userBToken}` },
        payload: { preset: 'samsung_t7' },
      });
      expect(simRes.statusCode).toBe(403);

      // Bob tries to configure storage cluster nodes
      const nodeRes = await app.inject({
        method: 'POST',
        url: '/api/v1/storage/nodes',
        headers: { authorization: `Bearer ${userBToken}` },
        payload: {
          name: 'Unauthorized Node',
          type: 'LOCAL_DISK',
          localPath: '/tmp/unauth',
        },
      });
      expect(nodeRes.statusCode).toBe(403);
    });

    it('should allow admin to simulate and attach external storage drives', async () => {
      const adminSimRes = await app.inject({
        method: 'POST',
        url: '/api/v1/storage/external-drives/simulate',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { preset: 'samsung_t7', setAsPrimaryTarget: true },
      });
      expect(adminSimRes.statusCode).toBe(201);
      const body = JSON.parse(adminSimRes.body);
      expect(body.name).toContain('Samsung T7');
      expect(body.isPrimaryWirelessTarget).toBe(true);
    });
  });

  describe('User Content Isolation & Direct User-to-User Sharing', () => {
    let aliceFileId: string;

    beforeAll(async () => {
      // Create Alice's private file
      const aliceFile = await prisma.fileItem.create({
        data: {
          familyId,
          userId: userAId,
          name: 'Alice_Confidential_Financials.pdf',
          isDirectory: false,
          mimeType: 'application/pdf',
          sizeBytes: BigInt(2048),
          storagePath: `staging/${familyId}/${userAId}/test.pdf`,
          isSharedVault: false,
        },
      });
      aliceFileId = aliceFile.id;
    });

    it('should strictly isolate private files so Bob cannot see Alice files in personal file list', async () => {
      // Alice sees her file
      const aliceListRes = await app.inject({
        method: 'GET',
        url: '/api/v1/files/list',
        headers: { authorization: `Bearer ${userAToken}` },
      });
      expect(aliceListRes.statusCode).toBe(200);
      const aliceItems = JSON.parse(aliceListRes.body).items;
      expect(aliceItems.some((f: any) => f.id === aliceFileId)).toBe(true);

      // Bob list files -> should NOT see Alice's file!
      const bobListRes = await app.inject({
        method: 'GET',
        url: '/api/v1/files/list',
        headers: { authorization: `Bearer ${userBToken}` },
      });
      expect(bobListRes.statusCode).toBe(200);
      const bobItems = JSON.parse(bobListRes.body).items;
      expect(bobItems.some((f: any) => f.id === aliceFileId)).toBe(false);
    });

    it('should reject unshared file access with 403 Forbidden', async () => {
      // Bob tries to stream Alice's file directly by ID
      const bobStreamRes = await app.inject({
        method: 'GET',
        url: `/api/v1/files/${aliceFileId}/download`,
        headers: { authorization: `Bearer ${userBToken}` },
      });
      expect(bobStreamRes.statusCode).toBe(403);
    });

    it('should allow Alice to share file directly with Bob by email', async () => {
      const shareRes = await app.inject({
        method: 'POST',
        url: `/api/v1/files/${aliceFileId}/share-user`,
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          email: 'bob@enterprise.corp',
          permission: 'READ',
        },
      });

      expect(shareRes.statusCode).toBe(200);
      const body = JSON.parse(shareRes.body);
      expect(body.message).toContain('Bob Member');
      expect(body.share.sharedWithUserId).toBe(userBId);
    });

    it('should allow Bob to see the file in shared-with-me and query list with shared=true', async () => {
      // Bob checks shared-with-me
      const sharedRes = await app.inject({
        method: 'GET',
        url: '/api/v1/files/shared-with-me',
        headers: { authorization: `Bearer ${userBToken}` },
      });

      expect(sharedRes.statusCode).toBe(200);
      const sharedItems = JSON.parse(sharedRes.body).items;
      expect(sharedItems.length).toBeGreaterThanOrEqual(1);
      const sharedFile = sharedItems.find((f: any) => f.id === aliceFileId);
      expect(sharedFile).toBeDefined();
      expect(sharedFile.name).toBe('Alice_Confidential_Financials.pdf');
      expect(sharedFile.sharedBy.email).toBe('alice@enterprise.corp');

      // Bob queries list with shared=true
      const listSharedRes = await app.inject({
        method: 'GET',
        url: '/api/v1/files/list?shared=true',
        headers: { authorization: `Bearer ${userBToken}` },
      });
      expect(listSharedRes.statusCode).toBe(200);
      const listSharedItems = JSON.parse(listSharedRes.body).items;
      expect(listSharedItems.some((f: any) => f.id === aliceFileId)).toBe(true);
    });

    it('should still forbid Charlie from accessing the file shared only with Bob', async () => {
      const charlieRes = await app.inject({
        method: 'GET',
        url: `/api/v1/files/${aliceFileId}/download`,
        headers: { authorization: `Bearer ${userCToken}` },
      });
      expect(charlieRes.statusCode).toBe(403);
    });

    it('should revoke sharing and immediately forbid Bob when Alice deletes the share', async () => {
      const revokeRes = await app.inject({
        method: 'DELETE',
        url: `/api/v1/files/${aliceFileId}/share-user/${userBId}`,
        headers: { authorization: `Bearer ${userAToken}` },
      });
      expect(revokeRes.statusCode).toBe(200);

      // Now Bob tries to access again
      const bobAccessRes = await app.inject({
        method: 'GET',
        url: `/api/v1/files/${aliceFileId}/download`,
        headers: { authorization: `Bearer ${userBToken}` },
      });
      expect(bobAccessRes.statusCode).toBe(403);
    });
  });
});
