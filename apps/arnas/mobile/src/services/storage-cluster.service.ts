import { ApiClient } from '../api/client';

export type StorageNodeType = 'LOCAL_DISK' | 'S3_COMPATIBLE' | 'REMOTE_NODE';
export type NodeStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE';

export interface StorageNodeItem {
  id: string;
  name: string;
  type: StorageNodeType;
  endpoint?: string | null;
  bucket?: string | null;
  localPath?: string | null;
  isPrimary: boolean;
  isActive: boolean;
  priority: number;
  status: NodeStatus;
  lastPingMs?: number | null;
  lastHealthCheckAt?: string | null;
  totalSpaceBytes: string;
  usedSpaceBytes: string;
}

export interface ClusterMetricsResponse {
  nodes: StorageNodeItem[];
  summary: {
    totalNodes: number;
    onlineNodes: number;
    degradedNodes: number;
    offlineNodes: number;
    totalFiles: number;
    totalCapacityBytes: string;
    totalUsedBytes: string;
    replicas: {
      synced: number;
      pending: number;
      replicating: number;
      failed: number;
    };
  };
}

export interface CreateStorageNodePayload {
  name: string;
  type: StorageNodeType;
  endpoint?: string;
  bucket?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  localPath?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  priority?: number;
}

export interface TestStorageNodePayload {
  type: StorageNodeType;
  endpoint?: string;
  bucket?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  localPath?: string;
}

export interface PingResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export class StorageClusterService {
  /**
   * Get full cluster health, node statuses, and replication counts
   */
  public static async getClusterMetrics(): Promise<ClusterMetricsResponse> {
    return await ApiClient.get<ClusterMetricsResponse>('/api/v1/storage/cluster');
  }

  /**
   * Add a new storage node to the cluster
   */
  public static async addStorageNode(payload: CreateStorageNodePayload): Promise<StorageNodeItem> {
    return await ApiClient.post<StorageNodeItem>('/api/v1/storage/nodes', payload);
  }

  /**
   * Update storage node settings
   */
  public static async updateStorageNode(id: string, payload: Partial<CreateStorageNodePayload>): Promise<StorageNodeItem> {
    return await ApiClient.put<StorageNodeItem>(`/api/v1/storage/nodes/${id}`, payload);
  }

  /**
   * Delete a secondary storage node
   */
  public static async deleteStorageNode(id: string): Promise<{ success: boolean; deletedNodeId: string }> {
    return await ApiClient.delete<{ success: boolean; deletedNodeId: string }>(`/api/v1/storage/nodes/${id}`);
  }

  /**
   * Test ping and credentials of a storage configuration before adding it
   */
  public static async testStorageNode(payload: TestStorageNodePayload): Promise<PingResult> {
    return await ApiClient.post<PingResult>('/api/v1/storage/test', payload);
  }

  /**
   * Trigger health check ping across all nodes in the cluster
   */
  public static async pingAllNodes(): Promise<{ nodes: Array<{ id: string; name: string; status: NodeStatus; pingMs: number | null }> }> {
    return await ApiClient.post<any>('/api/v1/storage/health', {});
  }

  /**
   * Trigger replication queue reconciliation
   */
  public static async reconcileCluster(): Promise<{ processed: number; succeeded: number; failed: number }> {
    return await ApiClient.post<any>('/api/v1/storage/reconcile', {});
  }
}
