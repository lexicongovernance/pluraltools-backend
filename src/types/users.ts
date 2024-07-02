import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from '../db';

export const insertUserSchema = createInsertSchema(users).transform((data) => {
  // make empty strings null
  return {
    ...data,
    email: data.email || null,
    username: data.username || null,
    firstName: data.firstName || null,
    telegram: data.telegram || null,
    lastName: data.lastName || null,
  };
});

export type UserData = z.infer<typeof insertUserSchema>;
