import { z } from 'zod';

export const environmentVariables = z.object({
  DATABASE_HOST: z.string(),
  DATABASE_PORT: z.coerce.number().optional(),
  DATABASE_NAME: z.string(),
  DATABASE_USER: z.string(),
  DATABASE_PASSWORD: z.string(),
  PORT: z.coerce.number().optional(),
  COOKIE_PASSWORD: z.string(),
});
