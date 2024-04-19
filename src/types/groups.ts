import { createInsertSchema } from 'drizzle-zod';
import { groups } from '../db';
import { z } from 'zod';

export const insertGroupsSchema = createInsertSchema(groups, {
  groupCategoryId: z.string().trim().min(1),
}).omit({
  createdAt: true,
  updatedAt: true,
  secret: true,
  id: true,
});
