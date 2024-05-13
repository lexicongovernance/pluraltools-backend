import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { events } from './events';
import { registrationData } from './registration-data';
import { users } from './users';
import { groups } from './groups';

export const registrations = pgTable('registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  eventId: uuid('event_id')
    .references(() => events.id)
    .notNull(),
  groupId: uuid('group_id').references(() => groups.id),
  // CAN BE: DRAFT, APPROVED, REJECTED AND MORE
  status: varchar('status').default('DRAFT'),
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
  group: one(groups, {
    fields: [registrations.groupId],
    references: [groups.id],
  }),
  registrationData: many(registrationData),
}));

export type Registration = typeof registrations.$inferSelect;
