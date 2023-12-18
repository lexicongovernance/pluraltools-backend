import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { cycles } from './cycles';

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  cycleId: uuid('id')
    .references(() => cycles.id)
    .notNull(),
  title: varchar('title', { length: 256 }).notNull(),
  description: varchar('title', { length: 256 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Question = typeof questions.$inferSelect;
