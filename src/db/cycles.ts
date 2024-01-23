import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { forumQuestions } from './forumQuestions';
import { events } from './events';

export const cyclesEnum = pgEnum('cycles_enum', ['OPEN', 'CLOSED', 'UPCOMING']);

export const cycles = pgTable('cycles', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  status: cyclesEnum('status').default('OPEN'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cyclesRelations = relations(cycles, ({ many, one }) => ({
  forumQuestions: many(forumQuestions),
  event: one(events, {
    fields: [cycles.eventId],
    references: [events.id],
  }),
}));

export type Cycle = typeof cycles.$inferSelect;
