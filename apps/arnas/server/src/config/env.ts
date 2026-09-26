import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file from root of server or project
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8080),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default('postgresql://arnas_admin:change_this_secret_password@localhost:5432/arnas_db?schema=public'),
  JWT_SECRET: z.string().min(16).default('arnas_super_secret_jwt_key_default_32chars_min'),
  JWT_REFRESH_SECRET: z.string().min(16).default('arnas_super_secret_refresh_jwt_key_32chars_min'),
  STORAGE_ROOT: z.string().default(path.resolve(process.cwd(), 'data/storage')),
  MAX_CHUNK_SIZE_BYTES: z.coerce.number().default(2 * 1024 * 1024), // 2MB
  THUMBNAIL_QUALITY: z.coerce.number().default(80),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
