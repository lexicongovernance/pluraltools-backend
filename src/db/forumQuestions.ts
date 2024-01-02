import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { cycles } from './cycles';
import { relations } from 'drizzle-orm';
import { options } from './options';

export const forumQuestions = pgTable('forum_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  cycleId: uuid('cycle_id')
    .references(() => cycles.id)
    .notNull(),
  title: varchar('title', { length: 256 }).notNull(),
  description: varchar('description', { length: 256 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const forumQuestionsRelations = relations(forumQuestions, ({ one, many }) => ({
  cycle: one(cycles, {
    fields: [forumQuestions.cycleId],
    references: [cycles.id],
  }),
  options: many(options),
}));

export type ForumQuestion = typeof forumQuestions.$inferSelect;
