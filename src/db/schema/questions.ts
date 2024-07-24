import { boolean, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { cycles } from './cycles';
import { relations } from 'drizzle-orm';
import { options } from './options';
import { questionsToGroupCategories } from './questions-to-group-categories';

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  cycleId: uuid('cycle_id')
    .references(() => cycles.id)
    .notNull(),
  title: varchar('title', { length: 256 }).notNull(),
  subTitle: varchar('sub_title', { length: 256 }),
  voteModel: varchar('vote_model', { length: 256 }).notNull().default('COCM'),
  showScore: boolean('show_score').default(false),
  userCanCreate: boolean('user_can_create').default(false),
  fields: jsonb('fields').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const forumQuestionsRelations = relations(questions, ({ one, many }) => ({
  cycle: one(cycles, {
    fields: [questions.cycleId],
    references: [cycles.id],
  }),
  options: many(options),
  questionsToGroupCategories: many(questionsToGroupCategories),
}));

export type Question = typeof questions.$inferSelect;
