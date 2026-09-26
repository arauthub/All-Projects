import { z } from 'zod';

export const syncAssetItemSchema = z.object({
  localId: z.string(),
  checksumSha256: z.string().length(64),
  sizeBytes: z.coerce.number().positive(),
  modifiedAt: z.string().optional(),
});

export const syncStatusSchema = z.object({
  deviceId: z.string().optional(),
  assets: z.array(syncAssetItemSchema),
});

export const uploadInitSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().default('application/octet-stream'),
  totalSizeBytes: z.coerce.number().positive(),
  chunkSizeBytes: z.coerce.number().positive().optional().default(2 * 1024 * 1024), // 2MB
  expectedSha256: z.string().length(64),
  isSharedVault: z.boolean().optional().default(false),
  parentFolderId: z.string().nullable().optional(),
  takenAt: z.string().datetime().optional(),
  // E2EE Zero-Knowledge parameters
  isEncrypted: z.boolean().optional().default(false),
  encryptionAlgo: z.string().optional().default('AES-256-GCM'),
  initializationVector: z.string().optional(),
  authTag: z.string().optional(),
  encryptedFileKey: z.string().optional(),
  encryptedMetadata: z.string().optional(),
});

export const uploadFinalizeSchema = z.object({
  uploadId: z.string().uuid(),
});

export type SyncStatusInput = z.infer<typeof syncStatusSchema>;
export type UploadInitInput = z.infer<typeof uploadInitSchema>;
export type UploadFinalizeInput = z.infer<typeof uploadFinalizeSchema>;
