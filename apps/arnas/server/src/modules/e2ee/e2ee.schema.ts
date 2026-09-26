import { z } from 'zod';

export const enableE2EESchema = z.object({
  encryptionSalt: z.string().min(16),
  publicKey: z.string().min(10),
  encryptedPrivateKey: z.string().min(20),
  keyDerivationIterations: z.number().int().min(50000).default(100000),
  recoveryHint: z.string().max(255).optional(),
});

export const updateVaultE2EESchema = z.object({
  vaultPublicKey: z.string().min(10),
  vaultEncryptedKey: z.string().min(20),
});

export type EnableE2EEInput = z.infer<typeof enableE2EESchema>;
export type UpdateVaultE2EEInput = z.infer<typeof updateVaultE2EESchema>;
