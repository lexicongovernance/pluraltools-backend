import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { relations } from 'drizzle-orm';
import { options } from './options';
import { questions } from './questions';

export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  optionId: uuid('option_id')
    .notNull()
    .references(() => options.id),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id),
  numOfVotes: integer('num_of_votes').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
  option: one(options, {
    fields: [votes.optionId],
    references: [options.id],
  }),
  question: one(questions, {
    fields: [votes.questionId],
    references: [questions.id],
  }),
}));

export type Vote = typeof votes.$inferSelect;
