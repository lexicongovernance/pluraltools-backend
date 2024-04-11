import { z } from 'zod';

export const joinGroupsSchema = z.object({
  secret: z.string().min(1),
});
