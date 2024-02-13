import { z } from 'zod';

export const verifyUserSchema = z.object({
  pcd: z.string(),
  email: z.string(),
  uuid: z.string(),
});
