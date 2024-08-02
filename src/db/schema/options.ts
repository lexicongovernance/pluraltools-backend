import { boolean, pgTable, timestamp, uuid, varchar, numeric, jsonb } from 'drizzle-orm/pg-core';
import { questions } from './questions';
import { relations } from 'drizzle-orm';
import { votes } from './votes';
import { registrations } from './registrations';
import { comments } from './comments';
import { users } from './users';
import { groups } from './groups';

export const options = pgTable('options', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  registrationId: uuid('registration_id').references(() => registrations.id),
  groupId: uuid('group_id').references(() => groups.id),
  questionId: uuid('question_id')
    .references(() => questions.id)
    .notNull(),
  title: varchar('title', { length: 256 }).notNull(),
  subTitle: varchar('sub_title'),
  show: boolean('show').default(false),
  voteScore: numeric('vote_score').notNull().default('0.0'),
  fundingRequest: numeric('funding_request').default('0.0'),
  data: jsonb('data'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const questionOptionsRelations = relations(options, ({ one, many }) => ({
  user: one(users, {
    fields: [options.userId],
    references: [users.id],
  }),
  question: one(questions, {
    fields: [options.questionId],
    references: [questions.id],
  }),
  registrations: one(registrations, {
    fields: [options.registrationId],
    references: [registrations.id],
  }),
  group: one(groups, {
    fields: [options.groupId],
    references: [groups.id],
  }),
  comment: many(comments),
  votes: many(votes),
}));

export type Option = typeof options.$inferSelect;
