import prisma from '../../db/prisma.js';

export interface AuditLogQuery {
  limit?: number;
  offset?: number;
  action?: string;
  userId?: string;
}

export class AuditService {
  /**
   * Record an enterprise audit trail event
   */
  public async logEvent(
    action: string,
    params: {
      userId?: string;
      familyId?: string;
      details?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    try {
      return await prisma.auditLog.create({
        data: {
          action,
          userId: params.userId || null,
          familyId: params.familyId || null,
          details: params.details ? (params.details as any) : undefined,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });
    } catch (err: any) {
      console.error('[AuditService] Failed to record audit log:', err.message);
      return null;
    }
  }

  /**
   * Fetch paginated audit trail logs for enterprise compliance
   */
  public async getLogs(familyId: string, query: AuditLogQuery) {
    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const where: any = { familyId };
    if (query.action) where.action = query.action;
    if (query.userId) where.userId = query.userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { total, limit, offset, logs };
  }
}

export const auditService = new AuditService();
