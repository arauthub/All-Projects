import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config/env.js';
import { storageService } from './services/storage.service.js';
import { storageOrchestrator } from './storage/orchestrator.js';
import authPlugin from './plugins/authenticate.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { familyRoutes } from './modules/family/family.routes.js';
import { syncRoutes } from './modules/sync/sync.routes.js';
import { fileRoutes } from './modules/files/file.routes.js';
import { storageRoutes } from './modules/storage/storage.routes.js';
import { e2eeRoutes } from './modules/e2ee/e2ee.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: env.NODE_ENV === 'development' ? {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    } : true,
    bodyLimit: 100 * 1024 * 1024, // 100MB body limit
  });

  // Ensure storage directories exist and cluster primary node is seeded
  await storageService.init();
  try {
    await storageOrchestrator.ensurePrimaryLocalNode();
  } catch (err: any) {
    app.log.warn(`Storage cluster initialization warning: ${err.message}`);
  }

  // Register CORS
  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  });

  // Register JWT
  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  // Register Multipart for streaming uploads
  await app.register(multipart, {
    limits: {
      fileSize: env.MAX_CHUNK_SIZE_BYTES * 2, // Allow chunk size
    },
  });

  // Support raw binary stream/buffer for chunk uploads
  app.addContentTypeParser(
    'application/octet-stream',
    { parseAs: 'buffer' },
    (req, body, done) => {
      done(null, body);
    }
  );

  // Register Swagger documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'ARNAS Core API',
        description: 'Autonomous & Private Family Cloud Storage API with Resumable Sync',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://${env.HOST}:${env.PORT}`,
          description: 'Development Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Register Custom Auth Plugin Decorator
  await app.register(authPlugin);

  // Register API Routes
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(familyRoutes, { prefix: '/api/v1/family' });
  await app.register(syncRoutes, { prefix: '/api/v1/sync' });
  await app.register(fileRoutes, { prefix: '/api/v1/files' });
  await app.register(storageRoutes, { prefix: '/api/v1/storage' });
  await app.register(e2eeRoutes, { prefix: '/api/v1/e2ee' });
  await app.register(auditRoutes, { prefix: '/api/v1/audit' });

  // Health check endpoint
  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'arnas-core-server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      storageRoot: storageService.getRootPath(),
    };
  });

  // Error Handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    if (error.name === 'ZodError' || (error as any).issues) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Request validation failed',
        details: (error as any).issues || error.message,
      });
    }

    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Request validation failed',
        details: error.validation,
      });
    }

    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name,
        message: error.message,
      });
    }

    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
    });
  });

  return app;
}
