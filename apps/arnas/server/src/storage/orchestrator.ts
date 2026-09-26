import crypto from 'crypto';
import { Readable } from 'stream';
import prisma from '../db/prisma.js';
import { env } from '../config/env.js';
import { StorageNode, NodeStatus, ReplicaStatus, StorageNodeType } from '@prisma/client';
import { IStorageDriver } from './drivers/storage-driver.interface.js';
import { LocalStorageDriver } from './drivers/local.driver.js';
import { S3StorageDriver } from './drivers/s3.driver.js';

export interface ClusterReadResult {
  stream: Readable;
  sourceNodeId: string;
  sourceNodeName: string;
  isFailover: boolean;
}

export class StorageOrchestrator {
  private drivers = new Map<string, IStorageDriver>();
  private isReplicating = false;

  /**
   * Ensure at least one Primary Local Storage Node exists in the database
   */
  public async ensurePrimaryLocalNode(): Promise<StorageNode> {
    const existing = await prisma.storageNode.findFirst({
      where: { isPrimary: true },
    });

    if (existing) {
      return existing;
    }

    // Create default local primary node pointing to env.STORAGE_ROOT
    const primary = await prisma.storageNode.create({
      data: {
        name: 'Local Primary NAS Drive',
        type: StorageNodeType.LOCAL_DISK,
        localPath: env.STORAGE_ROOT,
        isPrimary: true,
        isActive: true,
        priority: 1,
        status: NodeStatus.ONLINE,
        totalSpaceBytes: 1099511627776n, // 1 TB
        usedSpaceBytes: 0n,
      },
    });

    return primary;
  }

  /**
   * Retrieve or instantiate driver for a given StorageNode
   */
  public getDriver(node: StorageNode): IStorageDriver {
    if (this.drivers.has(node.id)) {
      return this.drivers.get(node.id)!;
    }

    let driver: IStorageDriver;
    if (node.type === StorageNodeType.LOCAL_DISK) {
      driver = new LocalStorageDriver(node.localPath || env.STORAGE_ROOT);
    } else if (node.type === StorageNodeType.S3_COMPATIBLE) {
      driver = new S3StorageDriver({
        endpoint: node.endpoint || undefined,
        bucket: node.bucket || 'arnas-vault',
        region: node.region || 'us-east-1',
        accessKeyId: node.accessKeyEncrypted || '',
        secretAccessKey: node.secretKeyEncrypted || '',
        forcePathStyle: true,
      });
    } else {
      // Remote cluster node fallback
      driver = new LocalStorageDriver(node.localPath || env.STORAGE_ROOT);
    }

    this.drivers.set(node.id, driver);
    return driver;
  }

  /**
   * Write file to primary storage node, then enqueue replication to all secondary nodes
   */
  public async writeToCluster(
    key: string,
    data: Buffer,
    fileItemId: string,
    mimeType?: string
  ): Promise<{ primaryNodeId: string; replicaCount: number }> {
    const primary = await this.ensurePrimaryLocalNode();
    const primaryDriver = this.getDriver(primary);

    // 1. Ingest immediately to primary
    await primaryDriver.write(key, data, mimeType);

    // 2. Update primary space
    await prisma.storageNode.update({
      where: { id: primary.id },
      data: {
        usedSpaceBytes: { increment: BigInt(data.length) },
      },
    });

    // 3. Find all other active storage nodes for fan-out replication
    const fileExists = await prisma.fileItem.findUnique({ where: { id: fileItemId } });
    if (!fileExists) {
      return { primaryNodeId: primary.id, replicaCount: 0 };
    }

    const secondaryNodes = await prisma.storageNode.findMany({
      where: {
        id: { not: primary.id },
        isActive: true,
      },
    });

    let replicaCount = 0;
    for (const secNode of secondaryNodes) {
      await prisma.fileReplica.upsert({
        where: {
          fileItemId_storageNodeId: {
            fileItemId,
            storageNodeId: secNode.id,
          },
        },
        create: {
          fileItemId,
          storageNodeId: secNode.id,
          replicaPath: key,
          checksumSha256: crypto.createHash('sha256').update(data).digest('hex'),
          status: ReplicaStatus.PENDING,
          retryCount: 0,
        },
        update: {
          replicaPath: key,
          checksumSha256: crypto.createHash('sha256').update(data).digest('hex'),
          status: ReplicaStatus.PENDING,
          retryCount: 0,
          errorMessage: null,
        },
      });
      replicaCount++;
    }

    // Trigger async replication in background
    if (replicaCount > 0) {
      this.reconcileCluster().catch((err) => {
        console.error('[StorageOrchestrator] Background replication error:', err.message);
      });
    }

    return { primaryNodeId: primary.id, replicaCount };
  }

  /**
   * Stream a file from the cluster with automatic failover to healthy replicas
   */
  public async readFromCluster(
    fileItemId: string,
    key: string,
    range?: { start: number; end: number }
  ): Promise<ClusterReadResult> {
    const primary = await this.ensurePrimaryLocalNode();

    // 1. Try reading from primary node if not OFFLINE
    if (primary.status !== NodeStatus.OFFLINE) {
      try {
        const driver = this.getDriver(primary);
        const stream = await driver.readStream(key, range);
        return {
          stream,
          sourceNodeId: primary.id,
          sourceNodeName: primary.name,
          isFailover: false,
        };
      } catch (err: any) {
        console.warn(`[StorageOrchestrator] Primary node read failed for key ${key}: ${err.message}. Initiating failover...`);
      }
    }

    // 2. Failover: Find synced replicas ordered by storage node priority
    const syncedReplicas = await prisma.fileReplica.findMany({
      where: {
        fileItemId,
        status: ReplicaStatus.SYNCED,
        storageNode: {
          isActive: true,
          status: { not: NodeStatus.OFFLINE },
        },
      },
      include: {
        storageNode: true,
      },
      orderBy: {
        storageNode: { priority: 'asc' },
      },
    });

    for (const replica of syncedReplicas) {
      try {
        const driver = this.getDriver(replica.storageNode);
        const stream = await driver.readStream(replica.replicaPath, range);
        console.info(`[StorageOrchestrator] Failover SUCCESS from replica node: ${replica.storageNode.name} (${replica.storageNode.id})`);
        return {
          stream,
          sourceNodeId: replica.storageNode.id,
          sourceNodeName: replica.storageNode.name,
          isFailover: true,
        };
      } catch (err: any) {
        console.warn(`[StorageOrchestrator] Replica read failed on node ${replica.storageNode.name}: ${err.message}`);
      }
    }

    throw new Error(`Failed to read file ${key} from primary and all ${syncedReplicas.length} replicas.`);
  }

  /**
   * Replicate a single replica from primary (or synced source) to target node
   */
  public async replicateOne(replicaId: string): Promise<void> {
    const replica = await prisma.fileReplica.findUnique({
      where: { id: replicaId },
      include: {
        fileItem: true,
        storageNode: true,
      },
    });

    if (!replica || !replica.fileItem || !replica.fileItem.storagePath) {
      throw new Error(`Replica or source file path missing for ID: ${replicaId}`);
    }

    // Update status to REPLICATING
    await prisma.fileReplica.update({
      where: { id: replicaId },
      data: { status: ReplicaStatus.REPLICATING },
    });

    try {
      const primary = await this.ensurePrimaryLocalNode();
      const sourceDriver = this.getDriver(primary);
      const targetDriver = this.getDriver(replica.storageNode);

      // Read source data buffer
      const buffer = await sourceDriver.readBuffer(replica.fileItem.storagePath);

      // Verify checksum
      const computedHash = crypto.createHash('sha256').update(buffer).digest('hex');
      if (replica.fileItem.checksumSha256 && computedHash !== replica.fileItem.checksumSha256) {
        throw new Error(`Checksum mismatch during replication. Expected ${replica.fileItem.checksumSha256}, got ${computedHash}`);
      }

      // Write to target replica node
      await targetDriver.write(replica.replicaPath, buffer, replica.fileItem.mimeType || undefined);

      // Update replica to SYNCED
      await prisma.fileReplica.update({
        where: { id: replicaId },
        data: {
          status: ReplicaStatus.SYNCED,
          checksumSha256: computedHash,
          syncedAt: new Date(),
          errorMessage: null,
        },
      });

      // Update target node used space
      await prisma.storageNode.update({
        where: { id: replica.storageNodeId },
        data: {
          usedSpaceBytes: { increment: BigInt(buffer.length) },
        },
      });
    } catch (err: any) {
      await prisma.fileReplica.update({
        where: { id: replicaId },
        data: {
          status: ReplicaStatus.FAILED,
          retryCount: { increment: 1 },
          errorMessage: err.message || 'Unknown replication failure',
        },
      });
      throw err;
    }
  }

  /**
   * Reconcile cluster: Process queued PENDING and retryable FAILED replicas
   */
  public async reconcileCluster(batchSize = 20): Promise<{ processed: number; succeeded: number; failed: number }> {
    if (this.isReplicating) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isReplicating = true;
    let succeeded = 0;
    let failed = 0;

    try {
      const pendingReplicas = await prisma.fileReplica.findMany({
        where: {
          OR: [
            { status: ReplicaStatus.PENDING },
            { status: ReplicaStatus.FAILED, retryCount: { lt: 5 } },
          ],
          storageNode: {
            isActive: true,
            status: { not: NodeStatus.OFFLINE },
          },
        },
        take: batchSize,
      });

      for (const rep of pendingReplicas) {
        try {
          await this.replicateOne(rep.id);
          succeeded++;
        } catch {
          failed++;
        }
      }

      return { processed: pendingReplicas.length, succeeded, failed };
    } finally {
      this.isReplicating = false;
    }
  }

  /**
   * Health check and benchmark ping for all active storage nodes
   */
  public async healthCheckAllNodes(): Promise<Array<{ id: string; name: string; status: NodeStatus; pingMs: number | null }>> {
    await this.ensurePrimaryLocalNode();
    const nodes = await prisma.storageNode.findMany({ where: { isActive: true } });
    const results = [];

    for (const node of nodes) {
      const driver = this.getDriver(node);
      const pingRes = await driver.ping();

      let status: NodeStatus = NodeStatus.ONLINE;
      if (!pingRes.ok) {
        status = NodeStatus.OFFLINE;
      } else if (pingRes.latencyMs > 1000) {
        status = NodeStatus.DEGRADED;
      }

      // Also get capacity
      const capacity = await driver.getCapacity();

      await prisma.storageNode.update({
        where: { id: node.id },
        data: {
          status,
          lastPingMs: pingRes.latencyMs,
          lastHealthCheckAt: new Date(),
          totalSpaceBytes: capacity.totalBytes,
          usedSpaceBytes: capacity.usedBytes > 0n ? capacity.usedBytes : undefined,
        },
      });

      results.push({
        id: node.id,
        name: node.name,
        status,
        pingMs: pingRes.ok ? pingRes.latencyMs : null,
      });
    }

    return results;
  }

  /**
   * Cluster-wide overview statistics
   */
  public async getClusterMetrics() {
    await this.ensurePrimaryLocalNode();
    const [nodes, totalFiles, replicas] = await Promise.all([
      prisma.storageNode.findMany({
        orderBy: [{ isPrimary: 'desc' }, { priority: 'asc' }],
      }),
      prisma.fileItem.count({ where: { isDeleted: false, isDirectory: false } }),
      prisma.fileReplica.findMany({
        select: { status: true },
      }),
    ]);

    const totalCapacity = nodes.reduce((acc, n) => acc + n.totalSpaceBytes, 0n);
    const totalUsed = nodes.reduce((acc, n) => acc + n.usedSpaceBytes, 0n);

    const replicaCounts = {
      synced: replicas.filter((r) => r.status === ReplicaStatus.SYNCED).length,
      pending: replicas.filter((r) => r.status === ReplicaStatus.PENDING).length,
      replicating: replicas.filter((r) => r.status === ReplicaStatus.REPLICATING).length,
      failed: replicas.filter((r) => r.status === ReplicaStatus.FAILED).length,
    };

    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        name: n.name,
        type: n.type,
        endpoint: n.endpoint,
        bucket: n.bucket,
        localPath: n.localPath,
        isPrimary: n.isPrimary,
        isActive: n.isActive,
        priority: n.priority,
        status: n.status,
        lastPingMs: n.lastPingMs,
        lastHealthCheckAt: n.lastHealthCheckAt,
        totalSpaceBytes: n.totalSpaceBytes.toString(),
        usedSpaceBytes: n.usedSpaceBytes.toString(),
      })),
      summary: {
        totalNodes: nodes.length,
        onlineNodes: nodes.filter((n) => n.status === NodeStatus.ONLINE).length,
        degradedNodes: nodes.filter((n) => n.status === NodeStatus.DEGRADED).length,
        offlineNodes: nodes.filter((n) => n.status === NodeStatus.OFFLINE).length,
        totalFiles,
        totalCapacityBytes: totalCapacity.toString(),
        totalUsedBytes: totalUsed.toString(),
        replicas: replicaCounts,
      },
    };
  }

  /**
   * Invalidate cached driver if node configuration changes
   */
  public invalidateDriver(nodeId: string): void {
    this.drivers.delete(nodeId);
  }
}

export const storageOrchestrator = new StorageOrchestrator();
