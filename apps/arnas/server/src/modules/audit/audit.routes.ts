import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { auditService } from './audit.service.js';

export const auditRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/audit/logs
  fastify.get('/logs', {
    schema: {
      tags: ['Audit Trail'],
      summary: 'Get enterprise compliance audit logs for the family/enterprise',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 },
          action: { type: 'string' },
          userId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const query = request.query as { limit?: number; offset?: number; action?: string; userId?: string };
    const logs = await auditService.getLogs(request.user.familyId, query);
    return reply.status(200).send(logs);
  });
};
