import { describe, it, expect, beforeAll } from 'vitest';
import { externalDriveService } from './external-drive.service.js';
import prisma from '../../db/prisma.js';
import { storageService } from '../../services/storage.service.js';

describe('External Drive NAS Subsystem', () => {
  beforeAll(async () => {
    await storageService.init();
  });

  it('should scan host machine and detect available external drive presets or mounts', async () => {
    const drives = await externalDriveService.scanExternalDrives();
    expect(drives).toBeDefined();
    expect(Array.isArray(drives)).toBe(true);
    expect(drives.length).toBeGreaterThan(0);

    const firstDrive = drives[0];
    expect(firstDrive.id).toBeDefined();
    expect(firstDrive.name).toBeDefined();
    expect(firstDrive.mountPath).toBeDefined();
    expect(['SSD', 'HDD', 'NVME']).toContain(firstDrive.mediaType);
    expect(firstDrive.temperatureC).toBeGreaterThan(0);
    expect(firstDrive.readSpeedMBps).toBeGreaterThan(0);
    expect(firstDrive.writeSpeedMBps).toBeGreaterThan(0);
  });

  let attachedDrive: any;

  it('should attach an external SSD, verify canary file, and set as primary wireless target', async () => {
    const testMountPath = './data/test-external-ssd-t7';
    attachedDrive = await externalDriveService.attachExternalDrive({
      mountPath: testMountPath,
      name: 'Samsung T7 Shield 2TB Test',
      mediaType: 'SSD',
      setAsPrimaryTarget: true,
    });

    expect(attachedDrive).toBeDefined();
    expect(attachedDrive.isAttached).toBe(true);
    expect(attachedDrive.isPrimaryWirelessTarget).toBe(true);
    expect(attachedDrive.canaryVerified).toBe(true);

    // Verify storage node in DB
    const node = await prisma.storageNode.findFirst({
      where: { id: attachedDrive.nodeId },
    });
    expect(node).toBeDefined();
    expect(node?.isPrimary).toBe(true);
    expect(node?.isActive).toBe(true);
  });

  it('should execute real-time I/O speed benchmark on the external drive', async () => {
    const testMountPath = './data/test-external-ssd-t7';
    const result = await externalDriveService.benchmarkDrive(testMountPath);

    expect(result).toBeDefined();
    expect(result.writeSpeedMBps).toBeGreaterThan(0);
    expect(result.readSpeedMBps).toBeGreaterThan(0);
    expect(result.iopsWrite).toBeGreaterThan(0);
    expect(result.iopsRead).toBeGreaterThan(0);
    expect(['EXCELLENT', 'GOOD', 'FAIR']).toContain(result.status);
  });

  it('should safely eject external drive and revert primary to server internal drive', async () => {
    const testMountPath = './data/test-external-ssd-t7';
    const ejectRes = await externalDriveService.ejectExternalDrive(testMountPath);

    expect(ejectRes.success).toBe(true);
    expect(ejectRes.message).toContain('Safe to disconnect');

    // Confirm node is not primary anymore
    const node = await prisma.storageNode.findFirst({
      where: { id: attachedDrive.nodeId },
    });
    expect(node?.isPrimary).toBe(false);
    expect(node?.isActive).toBe(false);
  });
});
