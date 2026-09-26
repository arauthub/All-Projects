import bcrypt from 'bcrypt';
import prisma from '../../db/prisma.js';
import { CreateMemberInput } from './family.schema.js';
import { storageService } from '../../services/storage.service.js';

export class FamilyService {
  /**
   * List all members belonging to the same family
   */
  public async listMembers(familyId: string) {
    const members = await prisma.user.findMany({
      where: { familyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        storageQuotaBytes: true,
        usedStorageBytes: true,
        createdAt: true,
        _count: {
          select: {
            files: true,
            devices: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      storageQuotaBytes: m.storageQuotaBytes.toString(),
      usedStorageBytes: m.usedStorageBytes.toString(),
      fileCount: m._count.files,
      deviceCount: m._count.devices,
      createdAt: m.createdAt,
    }));
  }

  /**
   * Admin invites/creates a new family member account
   */
  public async createMember(familyId: string, input: CreateMemberInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      const error: any = new Error('A user with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const newMember = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        role: input.role,
        familyId,
        storageQuotaBytes: BigInt(input.storageQuotaBytes),
      },
    });

    // Ensure member directories are created on disk
    await storageService.ensureMemberDirs(familyId, newMember.id);

    return {
      id: newMember.id,
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      storageQuotaBytes: newMember.storageQuotaBytes.toString(),
      usedStorageBytes: newMember.usedStorageBytes.toString(),
      createdAt: newMember.createdAt,
    };
  }

  /**
   * Update storage quota for a member
   */
  public async updateMemberQuota(familyId: string, memberId: string, newQuotaBytes: number) {
    const member = await prisma.user.findFirst({
      where: { id: memberId, familyId },
    });

    if (!member) {
      const error: any = new Error('Family member not found');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.user.update({
      where: { id: memberId },
      data: {
        storageQuotaBytes: BigInt(newQuotaBytes),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      storageQuotaBytes: updated.storageQuotaBytes.toString(),
      usedStorageBytes: updated.usedStorageBytes.toString(),
    };
  }

  /**
   * Check if user has sufficient quota for an incoming upload
   */
  public async checkStorageQuota(userId: string, incomingBytes: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { storageQuotaBytes: true, usedStorageBytes: true },
    });

    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const potentialUsage = user.usedStorageBytes + BigInt(incomingBytes);
    if (potentialUsage > user.storageQuotaBytes) {
      const error: any = new Error(
        `Storage quota exceeded. Available: ${(user.storageQuotaBytes - user.usedStorageBytes).toString()} bytes, required: ${incomingBytes} bytes`
      );
      error.statusCode = 403;
      throw error;
    }

    return true;
  }
}

export const familyService = new FamilyService();
