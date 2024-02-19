import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { comments } from './comments';
import { relations } from 'drizzle-orm';

export const likes = pgTable('likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  commentId: uuid('comment_id').references(() => comments.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  comment: one(comments, {
    fields: [likes.commentId],
    references: [comments.id],
  }),
}));

export type Like = typeof likes.$inferSelect;
