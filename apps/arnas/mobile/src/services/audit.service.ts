import { ApiClient } from '../api/client';

export interface AuditLogItem {
  id: string;
  userId?: string | null;
  familyId?: string | null;
  action: string;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  total: number;
  limit: number;
  offset: number;
  logs: AuditLogItem[];
}

export class AuditService {
  /**
   * Fetch paginated compliance audit logs
   */
  public static async getLogs(limit: number = 30, offset: number = 0): Promise<AuditLogsResponse> {
    return await ApiClient.get<AuditLogsResponse>(`/api/v1/audit/logs?limit=${limit}&offset=${offset}`);
  }
}
