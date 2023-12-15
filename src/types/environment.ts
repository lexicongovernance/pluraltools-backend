import { z } from 'zod';

export const environmentVariables = z.object({
  DB_CONNECTION_URL: z.string(),
  PORT: z.string().optional(),
});
