import { z } from 'zod';

export const joinSecretGroupsSchema = z.object({
  secret: z.string().min(1),
});

export const joinPublicGroupsSchema = z.object({
  id: z.string().min(1),
});

export const joinGroupsSchema = z.union([joinSecretGroupsSchema, joinPublicGroupsSchema]);
