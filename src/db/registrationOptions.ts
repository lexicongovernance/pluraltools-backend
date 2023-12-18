import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const registrationOptions = pgTable('registration_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 256 }).notNull(),
  category: varchar('category', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type RegistrationOption = typeof registrationOptions.$inferSelect;
