import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { syncService } from './sync.service.js';
import { syncStatusSchema, uploadInitSchema, uploadFinalizeSchema } from './sync.schema.js';

export const syncRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // All sync routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // POST /api/v1/sync/status (Delta sync determination)
  fastify.post('/status', {
    schema: {
      tags: ['Sync Engine'],
      summary: 'Compute delta sync for mobile assets against server state',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const input = syncStatusSchema.parse(request.body);
    const result = await syncService.getSyncStatus(request.user.id, request.user.familyId, input);
    return reply.status(200).send(result);
  });

  // POST /api/v1/sync/upload/init (Initialize resumable upload or deduplicate)
  fastify.post('/upload/init', {
    schema: {
      tags: ['Sync Engine'],
      summary: 'Initialize a resumable multi-part upload or check instant deduplication',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const input = uploadInitSchema.parse(request.body);
    const result = await syncService.initUpload(
      request.user.id,
      request.user.familyId,
      undefined,
      input
    );
    return reply.status(result.status === 'INITIATED' ? 201 : 200).send(result);
  });

  // PUT /api/v1/sync/upload/chunk (Upload individual 2MB chunk)
  fastify.put('/upload/chunk', {
    schema: {
      tags: ['Sync Engine'],
      summary: 'Upload a single binary chunk of a file',
      security: [{ bearerAuth: [] }],
      headers: {
        type: 'object',
        properties: {
          'x-upload-id': { type: 'string' },
          'x-chunk-index': { type: 'string' },
          'x-chunk-sha256': { type: 'string' },
        },
        required: ['x-upload-id', 'x-chunk-index'],
      },
    },
  }, async (request, reply) => {
    const uploadId = request.headers['x-upload-id'] as string;
    const chunkIndexStr = request.headers['x-chunk-index'] as string;
    const chunkSha256 = request.headers['x-chunk-sha256'] as string | undefined;

    if (!uploadId || chunkIndexStr === undefined) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Headers x-upload-id and x-chunk-index are required',
      });
    }

    const chunkIndex = parseInt(chunkIndexStr, 10);
    if (isNaN(chunkIndex)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Header x-chunk-index must be an integer',
      });
    }

    const chunkBuffer = Buffer.isBuffer(request.body)
      ? request.body
      : Buffer.from((request.body as any) || '');

    if (chunkBuffer.length === 0) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Empty chunk payload received',
      });
    }

    const result = await syncService.saveChunk(
      request.user.id,
      uploadId,
      chunkIndex,
      chunkSha256,
      chunkBuffer
    );

    return reply.status(200).send(result);
  });

  // POST /api/v1/sync/upload/finalize (Assemble chunks, verify full hash, create file)
  fastify.post('/upload/finalize', {
    schema: {
      tags: ['Sync Engine'],
      summary: 'Assemble all chunks, verify integrity, and commit file to permanent storage',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const input = uploadFinalizeSchema.parse(request.body);
    const result = await syncService.finalizeUpload(
      request.user.id,
      request.user.familyId,
      input.uploadId
    );
    return reply.status(201).send(result);
  });
};
