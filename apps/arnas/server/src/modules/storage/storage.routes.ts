import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { enterpriseStorageService } from './storage.service.js';
import { createStorageNodeSchema, updateStorageNodeSchema, testStorageNodeSchema } from './storage.schema.js';

export const storageRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/storage/cluster
  fastify.get('/cluster', {
    schema: {
      tags: ['Storage Cluster'],
      summary: 'Get cluster status, metrics, and registered storage nodes',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const metrics = await enterpriseStorageService.getClusterMetrics();
    return reply.status(200).send(metrics);
  });

  // POST /api/v1/storage/test
  fastify.post('/test', {
    schema: {
      tags: ['Storage Cluster'],
      summary: 'Test ping and credentials for a proposed storage node',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const input = testStorageNodeSchema.parse(request.body);
    const result = await enterpriseStorageService.testStorageNode(input);
    return reply.status(200).send(result);
  });

  // POST /api/v1/storage/nodes
  fastify.post('/nodes', {
    schema: {
      tags: ['Storage Cluster'],
      summary: 'Add a new Local or S3-compatible storage node to the cluster',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    // Only family admin / system admin can add storage servers
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Only administrators can configure storage nodes.' });
    }
    const input = createStorageNodeSchema.parse(request.body);
    const node = await enterpriseStorageService.createNode(input);
    return reply.status(201).send(node);
  });

  // PUT /api/v1/storage/nodes/:id
  fastify.put('/nodes/:id', {
    schema: {
      tags: ['Storage Cluster'],
      summary: 'Update storage node configuration or priority',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Only administrators can update storage nodes.' });
    }
    const { id } = request.params as { id: string };
    const input = updateStorageNodeSchema.parse(request.body);
    const node = await enterpriseStorageService.updateNode(id, input);
    return reply.status(200).send(node);
  });

  // DELETE /api/v1/storage/nodes/:id
  fastify.delete('/nodes/:id', {
    schema: {
      tags: ['Storage Cluster'],
      summary: 'Delete a secondary storage node from the cluster',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Only administrators can delete storage nodes.' });
    }
    const { id } = request.params as { id: string };
    const result = await enterpriseStorageService.deleteNode(id);
    return reply.status(200).send(result);
  });

  // POST /api/v1/storage/health
  fastify.post('/health', {
    schema: {
      tags: ['Storage Cluster'],
      summary: 'Trigger live health checks and ping all cluster nodes',
      security: [{ bearerAuth: [] }],
    },
  }, async (_request, reply) => {
    const results = await enterpriseStorageService.healthCheck();
    return reply.status(200).send({ nodes: results });
  });

  // POST /api/v1/storage/reconcile
  fastify.post('/reconcile', {
    schema: {
      tags: ['Storage Cluster'],
      summary: 'Trigger replication reconciliation queue',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Only administrators can trigger reconciliation.' });
    }
    const result = await enterpriseStorageService.reconcile();
    return reply.status(200).send(result);
  });
};
