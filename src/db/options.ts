import { pgTable, timestamp, integer, uuid, varchar } from 'drizzle-orm/pg-core';
import { questions } from './questions';
import { relations } from 'drizzle-orm';
import { votes } from './votes';

export const options = pgTable('options', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id')
    .references(() => questions.id)
    .notNull(),
  text: varchar('text', { length: 256 }).notNull(),
  voteCount: integer('vote_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const optionsRelations = relations(options, ({ one, many }) => ({
  question: one(questions, {
    fields: [options.questionId],
    references: [questions.id],
  }),
  votes: many(votes),
}));

export type Option = typeof options.$inferSelect;
