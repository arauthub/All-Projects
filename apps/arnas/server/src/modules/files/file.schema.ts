import { z } from 'zod';

export const fileListQuerySchema = z.object({
  folderId: z.string().nullable().optional(),
  vault: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  limit: z.coerce.number().positive().max(200).optional().default(100),
  offset: z.coerce.number().nonnegative().optional().default(0),
});

export type FileListQuery = z.infer<typeof fileListQuerySchema>;
