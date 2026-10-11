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

  // POST /api/v1/files/folder
  fastify.post('/folder', {
    schema: {
      tags: ['File Manager'],
      summary: 'Create a new directory in personal drive or family vault',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { name, parentFolderId, isSharedVault } = request.body as any;
    if (!name) return reply.status(400).send({ message: 'Folder name is required' });
    const folder = await fileService.createFolder(
      request.user.id,
      request.user.familyId,
      name,
      parentFolderId,
      isSharedVault
    );
    return reply.status(201).send(folder);
  });

  // PATCH /api/v1/files/:id/rename
  fastify.patch('/:id/rename', {
    schema: {
      tags: ['File Manager'],
      summary: 'Rename a file or folder',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name } = request.body as { name: string };
    if (!name) return reply.status(400).send({ message: 'New name is required' });
    const updated = await fileService.renameFile(request.user.id, request.user.familyId, id, name);
    return reply.status(200).send(updated);
  });

  // PATCH /api/v1/files/:id/favorite
  fastify.patch('/:id/favorite', {
    schema: {
      tags: ['File Manager'],
      summary: 'Toggle favorite status',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await fileService.toggleFavorite(request.user.id, request.user.familyId, id);
    return reply.status(200).send(result);
  });

  // PATCH /api/v1/files/:id/move
  fastify.patch('/:id/move', {
    schema: {
      tags: ['File Manager'],
      summary: 'Move file to a different folder',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { targetFolderId } = request.body as { targetFolderId?: string | null };
    const updated = await fileService.moveFile(request.user.id, request.user.familyId, id, targetFolderId);
    return reply.status(200).send(updated);
  });

  // POST /api/v1/files/:id/duplicate
  fastify.post('/:id/duplicate', {
    schema: {
      tags: ['File Manager'],
      summary: 'Duplicate an existing file',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const duplicate = await fileService.duplicateFile(request.user.id, request.user.familyId, id);
    return reply.status(201).send(duplicate);
  });

  // GET /api/v1/files/trash
  fastify.get('/trash', {
    schema: {
      tags: ['File Manager'],
      summary: 'List soft-deleted items in the recycle bin',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const trash = await fileService.listTrash(request.user.id, request.user.familyId);
    return reply.status(200).send(trash);
  });

  // POST /api/v1/files/:id/restore
  fastify.post('/:id/restore', {
    schema: {
      tags: ['File Manager'],
      summary: 'Restore a deleted item from the recycle bin',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await fileService.restoreFromTrash(request.user.id, request.user.familyId, id);
    return reply.status(200).send(result);
  });

  // DELETE /api/v1/files/:id/permanent
  fastify.delete('/:id/permanent', {
    schema: {
      tags: ['File Manager'],
      summary: 'Permanently purge a file from storage and database',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const isAdmin = request.user.role === 'ADMIN';
    const result = await fileService.permanentlyDelete(request.user.id, request.user.familyId, id, isAdmin);
    return reply.status(200).send(result);
  });

  // POST /api/v1/files/trash/empty
  fastify.post('/trash/empty', {
    schema: {
      tags: ['File Manager'],
      summary: 'Empty user recycle bin',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const isAdmin = request.user.role === 'ADMIN';
    const result = await fileService.emptyTrash(request.user.id, request.user.familyId);
    return reply.status(200).send(result);
  });

  // POST /api/v1/files/:id/share
  fastify.post('/:id/share', {
    schema: {
      tags: ['File Manager'],
      summary: 'Generate secure shareable link with expiration',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { expirationHours, hasPassword } = (request.body as any) || {};
    const result = await fileService.createShareLink(
      request.user.id,
      request.user.familyId,
      id,
      expirationHours || 24,
      !!hasPassword
    );
    return reply.status(200).send(result);
  });

  // POST /api/v1/files/:id/share-user (Direct User-to-User Sharing by Email)
  fastify.post('/:id/share-user', {
    schema: {
      tags: ['File Manager'],
      summary: 'Share a file or folder directly with another user by email',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { email, permission } = request.body as { email: string; permission?: 'READ' | 'WRITE' };
    if (!email) {
      return reply.status(400).send({ message: 'Target user email is required.' });
    }
    const result = await fileService.shareFileWithUser(request.user.id, id, email, permission || 'READ');
    return reply.status(200).send(result);
  });

  // GET /api/v1/files/shared-with-me
  fastify.get('/shared-with-me', {
    schema: {
      tags: ['File Manager'],
      summary: 'List files and folders shared with the current user',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const result = await fileService.listSharedWithMe(request.user.id);
    return reply.status(200).send(result);
  });

  // DELETE /api/v1/files/:id/share-user/:targetUserId
  fastify.delete('/:id/share-user/:targetUserId', {
    schema: {
      tags: ['File Manager'],
      summary: 'Revoke file sharing permission from a user',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          targetUserId: { type: 'string' },
        },
        required: ['id', 'targetUserId'],
      },
    },
  }, async (request, reply) => {
    const { id, targetUserId } = request.params as { id: string; targetUserId: string };
    const result = await fileService.revokeFileShare(request.user.id, id, targetUserId);
    return reply.status(200).send(result);
  });

  // GET /api/v1/files/nas/metrics
  fastify.get('/nas/metrics', {
    schema: {
      tags: ['File Manager'],
      summary: 'Get NAS storage pools, volume breakdown and live S.M.A.R.T. metrics',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    const metrics = await fileService.getNasMetrics(request.user.familyId);
    return reply.status(200).send(metrics);
  });
};

