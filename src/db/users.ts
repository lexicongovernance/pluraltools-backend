import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { federatedCredentials } from '.';
import { comments } from './comments';
import { likes } from './likes';
import { questionOptions } from './questionOptions';
import { registrations } from './registrations';
import { userAttributes } from './userAttributes';
import { usersToGroups } from './usersToGroups';
import { votes } from './votes';
import { usersToNotifications } from './usersToNotifications';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 256 }).unique(),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  email: varchar('email', { length: 256 }).unique(),
  telegram: varchar('telegram', { length: 256 }).unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  registrations: many(registrations),
  votes: many(votes),
  usersToGroups: many(usersToGroups),
  userAttributes: many(userAttributes),
  federatedCredential: one(federatedCredentials),
  comments: many(comments),
  likes: many(likes),
  questionOptions: many(questionOptions),
  notifications: many(usersToNotifications),
}));

export type User = typeof users.$inferSelect;
