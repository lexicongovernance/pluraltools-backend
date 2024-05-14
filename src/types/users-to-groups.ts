import { z } from 'zod';

export const joinSecretGroupsSchema = z.object({
  secret: z.string().min(1),
});

export const joinPublicGroupsSchema = z.object({
  groupId: z.string().min(1),
});

export const joinGroupsSchema = z.union([joinSecretGroupsSchema, joinPublicGroupsSchema]);

export const updateUsersToGroupsSchema = z.object({
  userId: z.string().min(1),
  groupId: z.string().min(1),
  id: z.string().min(1),
});

export const leaveGroupsSchema = z.object({
  usersToGroupsId: z.string().min(1),
});
