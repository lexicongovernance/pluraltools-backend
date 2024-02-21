import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from '../db';

export const groupIdsSchema = z.string().array();
export const userAttributesSchema = z.record(z.string());

export const insertUserSchema = createInsertSchema(users).extend({
  groupIds: groupIdsSchema,
  userAttributes: userAttributesSchema,
});
