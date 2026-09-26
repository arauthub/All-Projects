import { z } from 'zod';
import { Role } from '@prisma/client';

export const createMemberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(Role).default(Role.MEMBER),
  storageQuotaBytes: z.coerce.number().positive().optional().default(50 * 1024 * 1024 * 1024), // 50GB default
});

export const updateMemberQuotaSchema = z.object({
  storageQuotaBytes: z.coerce.number().positive(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberQuotaInput = z.infer<typeof updateMemberQuotaSchema>;
