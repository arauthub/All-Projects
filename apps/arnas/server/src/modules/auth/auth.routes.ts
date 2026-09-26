import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authService } from './auth.service.js';
import { loginSchema, refreshSchema } from './auth.schema.js';

export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // POST /login
  fastify.post('/login', {
    schema: {
      tags: ['Authentication'],
      summary: 'Authenticate family member and issue tokens',
    },
  }, async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const result = await authService.login(fastify, input);
    return reply.status(200).send(result);
  });

  // POST /refresh
  fastify.post('/refresh', {
    schema: {
      tags: ['Authentication'],
      summary: 'Refresh expired access token',
    },
  }, async (request, reply) => {
    const input = refreshSchema.parse(request.body);
    const result = await authService.refreshToken(fastify, input.refreshToken);
    return reply.status(200).send(result);
  });

  // GET /me
  fastify.get('/me', {
    schema: {
      tags: ['Authentication'],
      summary: 'Get current user profile and quota usage',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const result = await authService.getMe(request.user.id);
    return reply.status(200).send(result);
  });
};
