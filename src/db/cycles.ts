import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { forumQuestions } from './forumQuestions';

export const cyclesEnum = pgEnum('cycles_enum', ['OPEN', 'CLOSED', 'RESULTS']);

export const cycles = pgTable('cycles', {
  id: uuid('id').primaryKey().defaultRandom(),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  status: cyclesEnum('status').default('OPEN'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cyclesRelations = relations(cycles, ({ many }) => ({
  forumQuestions: many(forumQuestions),
}));

export type Cycle = typeof cycles.$inferSelect;
