import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { questionOptions } from './questionOptions';
import { users } from './users';
import { likes } from './likes';

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  username: varchar('username').references(() => users.username),
  questionOptionId: uuid('question_option_id').references(() => questionOptions.id),
  value: varchar('value').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, {
    fields: [comments.userId, comments.username],
    references: [users.id, users.username],
  }),
  questionOption: one(questionOptions, {
    fields: [comments.questionOptionId],
    references: [questionOptions.id],
  }),
  likes: many(likes),
}));

export type Comment = typeof comments.$inferSelect;
