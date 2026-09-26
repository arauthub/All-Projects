import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fsSync from 'fs';
import { fileService } from './file.service.js';
import { fileListQuerySchema } from './file.schema.js';

export const fileRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/v1/files/list
  fastify.get('/list', {
    schema: {
      tags: ['File Manager'],
      summary: 'List files and folders in personal drive or family vault',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const query = fileListQuerySchema.parse(request.query);
    const result = await fileService.listFiles(request.user.id, request.user.familyId, query);
    return reply.status(200).send(result);
  });

  // GET /api/v1/files/:id/download (Supports HTTP Range streaming & Cluster Failover)
  fastify.get('/:id/download', {
    schema: {
      tags: ['File Manager'],
      summary: 'Stream file content from cluster with HTTP Range and automatic replica failover',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const rangeHeader = request.headers.range;

    let range: { start: number; end: number } | undefined;
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : undefined;
      if (!isNaN(start)) {
        range = { start, end: end !== undefined && !isNaN(end) ? end : start + 1024 * 1024 * 5 }; // default 5MB chunk if end omitted
      }
    }

    const { file, stream, sourceNodeName, isFailover } = await fileService.getFileStreamFromCluster(
      request.user.id,
      request.user.familyId,
      id,
      range
    );

    const fileSize = Number(file.sizeBytes);

    reply.header('Accept-Ranges', 'bytes');
    reply.header('Content-Type', file.mimeType || 'application/octet-stream');
    reply.header('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`);
    reply.header('X-ARNAS-Storage-Node', sourceNodeName);
    reply.header('X-ARNAS-Failover', isFailover ? '1' : '0');

    // E2EE Headers for Zero-Knowledge Client Decryption
    if (file.isEncrypted) {
      reply.header('X-ARNAS-Encrypted', '1');
      if (file.encryptionAlgo) reply.header('X-ARNAS-Algo', file.encryptionAlgo);
      if (file.initializationVector) reply.header('X-ARNAS-IV', file.initializationVector);
      if (file.authTag) reply.header('X-ARNAS-Auth-Tag', file.authTag);
      if (file.encryptedFileKey) reply.header('X-ARNAS-File-Key', file.encryptedFileKey);
      if (file.encryptedMetadata) reply.header('X-ARNAS-Encrypted-Metadata', file.encryptedMetadata);
    }

    if (range && range.end) {
      const actualEnd = Math.min(range.end, fileSize - 1);
      const chunkSize = actualEnd - range.start + 1;
      reply.status(206);
      reply.header('Content-Range', `bytes ${range.start}-${actualEnd}/${fileSize}`);
      reply.header('Content-Length', chunkSize);
      return reply.send(stream);
    }

    reply.header('Content-Length', fileSize);
    return reply.send(stream);
  });

  // GET /api/v1/files/:id/thumbnail
  fastify.get('/:id/thumbnail', {
    schema: {
      tags: ['File Manager'],
      summary: 'Stream cached WebP thumbnail for media items',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { absolutePath, mimeType } = await fileService.getThumbnail(
      request.user.id,
      request.user.familyId,
      id
    );

    reply.header('Content-Type', mimeType);
    reply.header('Cache-Control', 'public, max-age=31536000, immutable');
    const stream = fsSync.createReadStream(absolutePath);
    return reply.send(stream);
  });

  // DELETE /api/v1/files/:id
  fastify.delete('/:id', {
    schema: {
      tags: ['File Manager'],
      summary: 'Soft-delete file and release user storage quota',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const isAdmin = request.user.role === 'ADMIN';
    const result = await fileService.softDeleteFile(
      request.user.id,
      request.user.familyId,
      id,
      isAdmin
    );
    return reply.status(200).send(result);
  });
};
