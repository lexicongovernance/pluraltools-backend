import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { registrations } from './registrations';
import { registrationFields } from '.';

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  description: varchar('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const eventsRelations = relations(events, ({ many }) => ({
  registrations: many(registrations),
  registrationFields: many(registrationFields),
}));

export type Event = typeof events.$inferSelect;
