import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { e2eeService } from './e2ee.service.js';
import { enableE2EESchema, updateVaultE2EESchema } from './e2ee.schema.js';

export const e2eeRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/e2ee/status
  fastify.get('/status', {
    schema: {
      tags: ['E2EE Security'],
      summary: 'Get E2EE cryptographic status and public keys',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const status = await e2eeService.getE2EEStatus(request.user.id, request.user.familyId);
    return reply.status(200).send(status);
  });

  // POST /api/v1/e2ee/enable
  fastify.post('/enable', {
    schema: {
      tags: ['E2EE Security'],
      summary: 'Enable Zero-Knowledge End-to-End Encryption with derived salt and keypair',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const input = enableE2EESchema.parse(request.body);
    const result = await e2eeService.enableUserE2EE(request.user.id, input);
    return reply.status(200).send(result);
  });

  // POST /api/v1/e2ee/vault
  fastify.post('/vault', {
    schema: {
      tags: ['E2EE Security'],
      summary: 'Configure shared family vault zero-knowledge encryption',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ message: 'Only family admins can configure family vault encryption.' });
    }
    const input = updateVaultE2EESchema.parse(request.body);
    const result = await e2eeService.configureVaultE2EE(request.user.familyId, input);
    return reply.status(200).send(result);
  });

  // GET /api/v1/e2ee/family-keys
  fastify.get('/family-keys', {
    schema: {
      tags: ['E2EE Security'],
      summary: 'Retrieve public keys of family members for shared vault encryption',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const keys = await e2eeService.getFamilyPublicKeys(request.user.familyId);
    return reply.status(200).send({ members: keys });
  });
};
