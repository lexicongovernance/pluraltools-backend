import { boolean, pgTable, timestamp, uuid, varchar, numeric } from 'drizzle-orm/pg-core';
import { forumQuestions } from './forumQuestions';
import { relations } from 'drizzle-orm';
import { votes } from './votes';
import { registrationData } from './registrationData';
import { comments } from './comments';

export const questionOptions = pgTable('question_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  registrationDataId: uuid('registration_data_id').references(() => registrationData.id),
  questionId: uuid('question_id')
    .references(() => forumQuestions.id)
    .notNull(),
  optionTitle: varchar('option_title', { length: 256 }).notNull(),
  optionSubTitle: varchar('option_sub_title'),
  accepted: boolean('accepted').default(false),
  voteScore: numeric('vote_score').notNull().default('0.0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const questionOptionsRelations = relations(questionOptions, ({ one, many }) => ({
  forumQuestion: one(forumQuestions, {
    fields: [questionOptions.questionId],
    references: [forumQuestions.id],
  }),
  registrationData: one(registrationData, {
    fields: [questionOptions.registrationDataId],
    references: [registrationData.id],
  }),
  comment: many(comments),
  votes: many(votes),
}));

export type QuestionOption = typeof questionOptions.$inferSelect;
