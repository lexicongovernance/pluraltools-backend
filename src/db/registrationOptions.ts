import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { usersToRegistrationOptions } from '.';

export const registrationOptions = pgTable('registration_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 256 }).notNull(),
  category: varchar('category', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const registrationOptionsRelations = relations(registrationOptions, ({ many }) => ({
  usersToRegistrationOptions: many(usersToRegistrationOptions),
}));

export type RegistrationOption = typeof registrationOptions.$inferSelect;
