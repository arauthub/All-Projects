import { buildApp } from './app.js';
import { env } from './config/env.js';

async function startServer() {
  try {
    const app = await buildApp();

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    console.log(`
🚀 ==============================================================
   ARNAS Server listening on http://${env.HOST}:${env.PORT}
   Swagger API Documentation: http://${env.HOST}:${env.PORT}/docs
   Storage Root: ${env.STORAGE_ROOT}
   Mode: ${env.NODE_ENV}
==============================================================
    `);
  } catch (err) {
    console.error('Failed to start ARNAS Server:', err);
    process.exit(1);
  }
}

startServer();
