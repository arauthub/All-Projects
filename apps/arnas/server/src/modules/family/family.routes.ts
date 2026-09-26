import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { familyService } from './family.service.js';
import { createMemberSchema, updateMemberQuotaSchema } from './family.schema.js';
import { z } from 'zod';

export const familyRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET /members (All authenticated family members can view list)
  fastify.get('/members', {
    schema: {
      tags: ['Family'],
      summary: 'List all members of current user family',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const members = await familyService.listMembers(request.user.familyId);
    return reply.status(200).send(members);
  });

  // POST /members (Admin only: Invite/Create new member)
  fastify.post('/members', {
    schema: {
      tags: ['Family'],
      summary: 'Admin: Add a new family member account',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [fastify.requireAdmin],
  }, async (request, reply) => {
    const input = createMemberSchema.parse(request.body);
    const newMember = await familyService.createMember(request.user.familyId, input);
    return reply.status(201).send(newMember);
  });

  // PATCH /members/:id/quota (Admin only: Adjust storage quota)
  fastify.patch('/members/:id/quota', {
    schema: {
      tags: ['Family'],
      summary: 'Admin: Update storage quota for a family member',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
    preHandler: [fastify.requireAdmin],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const input = updateMemberQuotaSchema.parse(request.body);
    const result = await familyService.updateMemberQuota(request.user.familyId, id, input.storageQuotaBytes);
    return reply.status(200).send(result);
  });
};
