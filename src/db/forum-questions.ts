import { boolean, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { cycles } from './cycles';
import { relations } from 'drizzle-orm';
import { questionOptions } from './question-options';
import { questionsToGroupCategories } from './questions-to-group-categories';

export const forumQuestions = pgTable('forum_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  cycleId: uuid('cycle_id')
    .references(() => cycles.id)
    .notNull(),
  questionTitle: varchar('question_title', { length: 256 }).notNull(),
  questionSubTitle: varchar('question_sub_title', { length: 256 }),
  showScore: boolean('show_score').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const forumQuestionsRelations = relations(forumQuestions, ({ one, many }) => ({
  cycle: one(cycles, {
    fields: [forumQuestions.cycleId],
    references: [cycles.id],
  }),
  questionOptions: many(questionOptions),
  questionsToGroupCategories: many(questionsToGroupCategories),
}));

export type ForumQuestion = typeof forumQuestions.$inferSelect;
