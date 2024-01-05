import { createInsertSchema } from 'drizzle-zod';
import { registrations } from '../db/registrations';
import { z } from 'zod';
import { users } from '../db';
import { group } from 'console';

export const groupIdsSchema = z.string().array();

export const insertUserSchema = createInsertSchema(users).extend({
  groupIds: groupIdsSchema,
});
