import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { registrations } from './registrations';
import { cycles, registrationFields } from '.';

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  requireApproval: boolean('require_approval').notNull().default(false),
  description: varchar('description'),
  link: varchar('link'),
  registrationDescription: varchar('registration_description'),
  imageUrl: varchar('image_url'),
  eventDisplayRank: integer('event_display_rank'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const eventsRelations = relations(events, ({ many }) => ({
  registrations: many(registrations),
  registrationFields: many(registrationFields),
  cycles: many(cycles),
}));

export type Event = typeof events.$inferSelect;
