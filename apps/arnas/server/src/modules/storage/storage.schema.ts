import { z } from 'zod';
import { StorageNodeType } from '@prisma/client';

export const createStorageNodeSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.nativeEnum(StorageNodeType),
  endpoint: z.string().url().optional(),
  bucket: z.string().optional(),
  region: z.string().default('us-east-1'),
  accessKey: z.string().optional(),
  secretKey: z.string().optional(),
  localPath: z.string().optional(),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(1).max(100).default(1),
});

export const updateStorageNodeSchema = createStorageNodeSchema.partial();

export const testStorageNodeSchema = z.object({
  type: z.nativeEnum(StorageNodeType),
  endpoint: z.string().url().optional(),
  bucket: z.string().optional(),
  region: z.string().default('us-east-1'),
  accessKey: z.string().optional(),
  secretKey: z.string().optional(),
  localPath: z.string().optional(),
});

export type CreateStorageNodeInput = z.infer<typeof createStorageNodeSchema>;
export type UpdateStorageNodeInput = z.infer<typeof updateStorageNodeSchema>;
export type TestStorageNodeInput = z.infer<typeof testStorageNodeSchema>;
