import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { questions } from './questions'; // Assuming your questions file is in the same directory
import { relations } from 'drizzle-orm';

export const options = pgTable('options', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id')
    .references(() => questions.id)
    .notNull(),
  text: varchar('text', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const optionsRelations = relations(options, ({ one }) => ({
  question: one(questions, {
    fields: [options.questionId],
    references: [questions.id],
  }),
}));

export type Option = typeof options.$inferSelect;