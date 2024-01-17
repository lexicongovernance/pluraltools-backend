import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { academicCredentials } from './academicCredentials';
import { relations } from 'drizzle-orm';

export const usersToAcademicCredentials = pgTable('users_to_academic_credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  credentialId: uuid('credential_id')
    .notNull()
    .references(() => academicCredentials.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const usersToAcademicCredentialsRelations = relations(
  usersToAcademicCredentials,
  ({ one }) => ({
    credential: one(academicCredentials, {
      fields: [usersToAcademicCredentials.credentialId],
      references: [academicCredentials.id],
    }),
    user: one(users, {
      fields: [usersToAcademicCredentials.userId],
      references: [users.id],
    }),
  }),
);

export type UsersToAcademicCredentials = typeof usersToAcademicCredentials.$inferSelect;
