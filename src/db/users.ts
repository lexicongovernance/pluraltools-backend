import { relations } from 'drizzle-orm';
import { boolean, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { registrations } from './registrations';
import { votes } from './votes';
import { usersToGroups } from './usersToGroups';
import { userAttributes } from './userAttributes';
import { federatedCredentials } from '.';
import { comments } from './comments';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 256 }).unique(),
  name: varchar('name'),
  email: varchar('email', { length: 256 }).unique(),
  emailNotification: boolean('email_notification').default(true),
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
}));

export type User = typeof users.$inferSelect;
