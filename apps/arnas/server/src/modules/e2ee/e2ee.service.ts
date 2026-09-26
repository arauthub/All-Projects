import prisma from '../../db/prisma.js';
import { EnableE2EEInput, UpdateVaultE2EEInput } from './e2ee.schema.js';

export class E2EEService {
  /**
   * Get E2EE status for user and family vault
   */
  public async getE2EEStatus(userId: string, familyId: string) {
    const [user, family] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          isE2EEEnabled: true,
          encryptionSalt: true,
          publicKey: true,
          encryptedPrivateKey: true,
          keyDerivationIterations: true,
          recoveryHint: true,
        },
      }),
      prisma.family.findUnique({
        where: { id: familyId },
        select: {
          id: true,
          isVaultE2EEEnabled: true,
          vaultPublicKey: true,
          vaultEncryptedKey: true,
        },
      }),
    ]);

    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      user: {
        isE2EEEnabled: user.isE2EEEnabled,
        encryptionSalt: user.encryptionSalt,
        publicKey: user.publicKey,
        encryptedPrivateKey: user.encryptedPrivateKey,
        keyDerivationIterations: user.keyDerivationIterations,
        recoveryHint: user.recoveryHint,
      },
      familyVault: {
        isVaultE2EEEnabled: family?.isVaultE2EEEnabled ?? false,
        vaultPublicKey: family?.vaultPublicKey,
        vaultEncryptedKey: family?.vaultEncryptedKey,
      },
    };
  }

  /**
   * Enable zero-knowledge E2EE for the calling user
   */
  public async enableUserE2EE(userId: string, input: EnableE2EEInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isE2EEEnabled: true,
        encryptionSalt: input.encryptionSalt,
        publicKey: input.publicKey,
        encryptedPrivateKey: input.encryptedPrivateKey,
        keyDerivationIterations: input.keyDerivationIterations,
        recoveryHint: input.recoveryHint || null,
      },
      select: {
        id: true,
        isE2EEEnabled: true,
        publicKey: true,
        keyDerivationIterations: true,
      },
    });

    return user;
  }

  /**
   * Configure shared family vault E2EE (Admin only)
   */
  public async configureVaultE2EE(familyId: string, input: UpdateVaultE2EEInput) {
    const family = await prisma.family.update({
      where: { id: familyId },
      data: {
        isVaultE2EEEnabled: true,
        vaultPublicKey: input.vaultPublicKey,
        vaultEncryptedKey: input.vaultEncryptedKey,
      },
      select: {
        id: true,
        isVaultE2EEEnabled: true,
        vaultPublicKey: true,
      },
    });

    return family;
  }

  /**
   * List public keys of all family members for secure multi-party vault encryption
   */
  public async getFamilyPublicKeys(familyId: string) {
    const members = await prisma.user.findMany({
      where: {
        familyId,
        isE2EEEnabled: true,
        publicKey: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        publicKey: true,
      },
    });

    return members;
  }
}

export const e2eeService = new E2EEService();
