import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from '../db';

export const groupIdsSchema = z
  .object({
    groupId: z.string(),
    groupLabelId: z.string(),
  })
  .array();

export const userAttributesSchema = z.record(z.string());

export const insertUserSchema = createInsertSchema(users)
  .extend({
    groupIds: groupIdsSchema,
    userAttributes: userAttributesSchema,
  })
  .transform((data) => {
    // make empty strings null
    return {
      ...data,
      email: data.email || null,
      username: data.username || null,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
    };
  });

export type UserData = z.infer<typeof insertUserSchema>;
