import { boolean, pgTable, timestamp, uuid, varchar, numeric } from 'drizzle-orm/pg-core';
import { forumQuestions } from './forumQuestions';
import { events } from './events';
import { relations } from 'drizzle-orm';
import { votes } from './votes';
import { registrations } from './registrations';
import { comments } from './comments';
import { users } from './users';

export const questionOptions = pgTable('question_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  registrationId: uuid('registration_id').references(() => registrations.id),
  questionId: uuid('question_id')
    .references(() => forumQuestions.id)
    .notNull(),
  eventId: uuid('event_id')
  .references(() => events.id)
  .notNull(),
  optionTitle: varchar('option_title', { length: 256 }).notNull(),
  optionSubTitle: varchar('option_sub_title'),
  accepted: boolean('accepted').default(false),
  voteScore: numeric('vote_score').notNull().default('0.0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const questionOptionsRelations = relations(questionOptions, ({ one, many }) => ({
  user: one(users, {
    fields: [questionOptions.userId],
    references: [users.id],
  }),
  forumQuestion: one(forumQuestions, {
    fields: [questionOptions.questionId],
    references: [forumQuestions.id],
  }),
  registrations: one(registrations, {
    fields: [questionOptions.registrationId],
    references: [registrations.id],
  }),
  event: one(events, {
    fields: [questionOptions.eventId],
    references: [events.id],
  }),
  comment: many(comments),
  votes: many(votes),
}));

export type QuestionOption = typeof questionOptions.$inferSelect;
