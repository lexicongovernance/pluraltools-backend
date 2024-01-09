import { pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';
import { relations } from 'drizzle-orm';
import { events } from './events';
import { registrationData } from './registrationData';

export const registrationEnum = pgEnum('registration_enum', ['DRAFT', 'PUBLISHED', 'APPROVED']);

export const registrations = pgTable('registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id)
    .notNull(),
  status: registrationEnum('status').default('DRAFT'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const registrationsRelations = relations(registrations, ({ one, many }) => ({
  user: one(users, {
    fields: [registrations.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
  registrationData: many(registrationData),
}));

export type Registration = typeof registrations.$inferSelect; // return type when queried
