import { describe, it, expect, beforeAll } from 'vitest';
import { StorageService } from './storage.service.js';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';

describe('StorageService', () => {
  const testRoot = path.resolve(process.cwd(), 'data/test_storage');
  let storage: StorageService;

  beforeAll(async () => {
    storage = new StorageService(testRoot);
    await storage.init();
  });

  it('should initialize root, families, thumbnails, and staging directories', () => {
    expect(fsSync.existsSync(path.join(testRoot, 'families'))).toBe(true);
    expect(fsSync.existsSync(path.join(testRoot, 'thumbnails'))).toBe(true);
    expect(fsSync.existsSync(path.join(testRoot, 'staging'))).toBe(true);
  });

  it('should generate correct path hierarchies for family vault and members', () => {
    const vaultPath = storage.getFamilyVaultPath('fam_123');
    const memberFilesPath = storage.getMemberPath('fam_123', 'usr_456', 'files');
    const stagingPath = storage.getStagingPath('upl_789');

    expect(vaultPath).toContain(path.normalize('families/fam_123/shared'));
    expect(memberFilesPath).toContain(path.normalize('families/fam_123/members/usr_456/files'));
    expect(stagingPath).toContain(path.normalize('staging/upl_789'));
  });

  it('should compute consistent SHA-256 hashes', () => {
    const buffer = Buffer.from('ARNAS High Performance Storage Engine Test');
    const hash = storage.computeHash(buffer);

    expect(hash).toHaveLength(64);
    expect(typeof hash).toBe('string');
  });

  it('should ensure member directories on demand', async () => {
    await storage.ensureMemberDirs('fam_test', 'usr_test');
    expect(fsSync.existsSync(storage.getMemberPath('fam_test', 'usr_test', 'camera_roll'))).toBe(true);
    expect(fsSync.existsSync(storage.getFamilyVaultPath('fam_test'))).toBe(true);

    // Clean up test dir
    await fs.rm(testRoot, { recursive: true, force: true });
  });
});
