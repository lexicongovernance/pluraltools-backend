import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { relations } from 'drizzle-orm';

export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  numOfVotes: integer('num_of_votes').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
}));

export type Vote = typeof votes.$inferSelect;
