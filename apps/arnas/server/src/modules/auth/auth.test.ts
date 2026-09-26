import { describe, it, expect, beforeAll, vi } from 'vitest';
import { buildApp } from '../../app.js';
import { FastifyInstance } from 'fastify';
import prisma from '../../db/prisma.js';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

describe('Auth & Family ACL System', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  describe('JWT and Admin Guard Tests', () => {
    it('should reject unauthenticated requests to protected routes with 401', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.statusCode).toBe(401);
    });

    it('should reject non-admin members trying to access admin endpoints with 403', async () => {
      // Create a valid member JWT token
      const memberToken = app.jwt.sign({
        id: 'usr_member_123',
        email: 'member@example.com',
        name: 'Member User',
        role: Role.MEMBER,
        familyId: 'fam_123',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/family/members',
        headers: {
          authorization: `Bearer ${memberToken}`,
        },
        payload: {
          name: 'New Kid',
          email: 'kid@example.com',
          password: 'Password123!',
          role: 'MEMBER',
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('Admin access required');
    });

    it('should accept valid admin token on admin endpoints', async () => {
      // Mock prisma.user.findUnique to return null (no duplicate email)
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null as any);
      // Mock prisma.user.create to return new user
      vi.spyOn(prisma.user, 'create').mockResolvedValue({
        id: 'usr_new_999',
        name: 'New Family Member',
        email: 'new@example.com',
        role: Role.MEMBER,
        storageQuotaBytes: BigInt(53687091200),
        usedStorageBytes: BigInt(0),
        createdAt: new Date(),
        updatedAt: new Date(),
        familyId: 'fam_123',
        passwordHash: 'hashed',
      } as any);

      const adminToken = app.jwt.sign({
        id: 'usr_admin_123',
        email: 'admin@example.com',
        name: 'Admin User',
        role: Role.ADMIN,
        familyId: 'fam_123',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/family/members',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          name: 'New Family Member',
          email: 'new@example.com',
          password: 'Password123!',
          role: 'MEMBER',
          storageQuotaBytes: 53687091200,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('New Family Member');
      expect(body.email).toBe('new@example.com');
      expect(body.storageQuotaBytes).toBe('53687091200');
    });
  });

  describe('Storage Quota Enforcement', () => {
    it('should throw 403 when incoming bytes exceed storageQuotaBytes', async () => {
      const { familyService } = await import('../family/family.service.js');

      // Mock user with 100MB quota and 95MB used
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'usr_quota_test',
        storageQuotaBytes: BigInt(100 * 1024 * 1024), // 100 MB
        usedStorageBytes: BigInt(95 * 1024 * 1024),  // 95 MB used
      } as any);

      // Attempting to upload 10MB (total 105MB > 100MB quota)
      await expect(
        familyService.checkStorageQuota('usr_quota_test', 10 * 1024 * 1024)
      ).rejects.toThrow('Storage quota exceeded');
    });

    it('should allow upload when within storageQuotaBytes', async () => {
      const { familyService } = await import('../family/family.service.js');

      // Mock user with 100MB quota and 50MB used
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'usr_quota_test_ok',
        storageQuotaBytes: BigInt(100 * 1024 * 1024), // 100 MB
        usedStorageBytes: BigInt(50 * 1024 * 1024),  // 50 MB used
      } as any);

      // Attempting to upload 10MB (total 60MB <= 100MB quota)
      const allowed = await familyService.checkStorageQuota('usr_quota_test_ok', 10 * 1024 * 1024);
      expect(allowed).toBe(true);
    });
  });
});
