import prisma from '../../db/prisma.js';
import { storageOrchestrator } from '../../storage/orchestrator.js';
import { LocalStorageDriver } from '../../storage/drivers/local.driver.js';
import { S3StorageDriver } from '../../storage/drivers/s3.driver.js';
import { CreateStorageNodeInput, UpdateStorageNodeInput, TestStorageNodeInput } from './storage.schema.js';
import { StorageNodeType, NodeStatus } from '@prisma/client';

export class EnterpriseStorageService {
  /**
   * Get overall cluster metrics and node list
   */
  public async getClusterMetrics() {
    return await storageOrchestrator.getClusterMetrics();
  }

  /**
   * Test connectivity to a proposed storage configuration without saving it
   */
  public async testStorageNode(input: TestStorageNodeInput) {
    if (input.type === StorageNodeType.LOCAL_DISK) {
      if (!input.localPath) {
        throw new Error('localPath is required for LOCAL_DISK nodes');
      }
      const driver = new LocalStorageDriver(input.localPath);
      return await driver.ping();
    } else if (input.type === StorageNodeType.S3_COMPATIBLE) {
      if (!input.bucket || !input.accessKey || !input.secretKey) {
        throw new Error('bucket, accessKey, and secretKey are required for S3_COMPATIBLE nodes');
      }
      const driver = new S3StorageDriver({
        endpoint: input.endpoint,
        bucket: input.bucket,
        region: input.region || 'us-east-1',
        accessKeyId: input.accessKey,
        secretAccessKey: input.secretKey,
      });
      return await driver.ping();
    }
    throw new Error(`Unsupported storage type: ${input.type}`);
  }

  private formatNode(node: any) {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      endpoint: node.endpoint,
      bucket: node.bucket,
      localPath: node.localPath,
      isPrimary: node.isPrimary,
      isActive: node.isActive,
      priority: node.priority,
      status: node.status,
      lastPingMs: node.lastPingMs,
      lastHealthCheckAt: node.lastHealthCheckAt,
      totalSpaceBytes: node.totalSpaceBytes ? node.totalSpaceBytes.toString() : '0',
      usedSpaceBytes: node.usedSpaceBytes ? node.usedSpaceBytes.toString() : '0',
    };
  }

  /**
   * Register a new storage node in the cluster
   */
  public async createNode(input: CreateStorageNodeInput) {
    // If set to primary, clear existing primary flags
    if (input.isPrimary) {
      await prisma.storageNode.updateMany({
        where: { isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const node = await prisma.storageNode.create({
      data: {
        name: input.name,
        type: input.type,
        endpoint: input.endpoint || null,
        bucket: input.bucket || null,
        region: input.region || 'us-east-1',
        accessKeyEncrypted: input.accessKey || null,
        secretKeyEncrypted: input.secretKey || null,
        localPath: input.localPath || null,
        isPrimary: input.isPrimary ?? false,
        isActive: input.isActive ?? true,
        priority: input.priority ?? 1,
        status: NodeStatus.ONLINE,
      },
    });

    // Test ping
    try {
      const driver = storageOrchestrator.getDriver(node);
      const pingRes = await driver.ping();
      const updated = await prisma.storageNode.update({
        where: { id: node.id },
        data: {
          lastPingMs: pingRes.latencyMs,
          lastHealthCheckAt: new Date(),
          status: pingRes.ok ? NodeStatus.ONLINE : NodeStatus.OFFLINE,
        },
      });
      return this.formatNode(updated);
    } catch {
      // non-blocking
    }

    return this.formatNode(node);
  }

  /**
   * Update an existing storage node
   */
  public async updateNode(id: string, input: UpdateStorageNodeInput) {
    if (input.isPrimary) {
      await prisma.storageNode.updateMany({
        where: { id: { not: id }, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const node = await prisma.storageNode.update({
      where: { id },
      data: {
        name: input.name,
        type: input.type,
        endpoint: input.endpoint,
        bucket: input.bucket,
        region: input.region,
        accessKeyEncrypted: input.accessKey,
        secretKeyEncrypted: input.secretKey,
        localPath: input.localPath,
        isPrimary: input.isPrimary,
        isActive: input.isActive,
        priority: input.priority,
      },
    });

    storageOrchestrator.invalidateDriver(id);
    return this.formatNode(node);
  }

  /**
   * Delete a secondary storage node
   */
  public async deleteNode(id: string) {
    const node = await prisma.storageNode.findUnique({ where: { id } });
    if (!node) {
      const error: any = new Error('Storage node not found');
      error.statusCode = 404;
      throw error;
    }

    if (node.isPrimary) {
      const error: any = new Error('Cannot delete the primary storage node. Designate another primary node first.');
      error.statusCode = 400;
      throw error;
    }

    storageOrchestrator.invalidateDriver(id);
    await prisma.storageNode.delete({ where: { id } });
    return { success: true, deletedNodeId: id };
  }

  /**
   * Trigger health check ping on all nodes
   */
  public async healthCheck() {
    return await storageOrchestrator.healthCheckAllNodes();
  }

  /**
   * Trigger manual reconciliation queue run
   */
  public async reconcile() {
    return await storageOrchestrator.reconcileCluster(50);
  }
}

export const enterpriseStorageService = new EnterpriseStorageService();
