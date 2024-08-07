import { z } from 'zod';

export const verifyZupassUserSchema = z.object({
  pcd: z.string(),
  email: z.string(),
  uuid: z.string(),
});

export const verifySIWEUserSchema = z.object({
  message: z.string(),
  signature: z.string(),
});
