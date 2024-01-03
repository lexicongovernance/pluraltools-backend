import { pgTable, timestamp, integer, uuid, varchar } from 'drizzle-orm/pg-core';
import { forumQuestions } from './forumQuestions';
import { relations } from 'drizzle-orm';
import { votes } from './votes';

export const questionOptions = pgTable('question_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id')
    .references(() => forumQuestions.id)
    .notNull(),
  text: varchar('text', { length: 256 }).notNull(),
  voteCount: integer('vote_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const questionOptionsRelations = relations(questionOptions, ({ one, many }) => ({
  forumQuestion: one(forumQuestions, {
    fields: [questionOptions.questionId],
    references: [forumQuestions.id],
  }),
  votes: many(votes),
}));

export type QuestionOption = typeof questionOptions.$inferSelect;
