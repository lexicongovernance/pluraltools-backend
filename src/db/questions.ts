import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { cycles } from './cycles';
import { relations } from 'drizzle-orm';
import { options } from './options';

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

export const questionsRelations = relations(questions, ({ one, many }) => ({
  cycle: one(cycles, {
    fields: [questions.cycleId],
    references: [cycles.id],
  }),
  options: many(options, { relationName: 'options' }),
}));

export type Question = typeof questions.$inferSelect;
