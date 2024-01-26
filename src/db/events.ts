import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { registrations } from './registrations';
import { cycles, registrationFields } from '.';

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  description: varchar('description'),
  registrationDescription: varchar('registration_description'),
  image_url: varchar('image_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const eventsRelations = relations(events, ({ many }) => ({
  registrations: many(registrations),
  registrationFields: many(registrationFields),
  cycles: many(cycles),
}));

export type Event = typeof events.$inferSelect;
