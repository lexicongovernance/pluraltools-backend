import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { registrationOptions } from './registrationOptions';
import { relations } from 'drizzle-orm';

export const usersToRegistrationOptions = pgTable('users_to_registration_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  registrationOptionId: uuid('registration_option_id')
    .references(() => registrationOptions.id)
    .notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const usersToRegistrationOptionsRelations = relations(
  usersToRegistrationOptions,
  ({ one }) => ({
    registrationOption: one(registrationOptions, {
      fields: [usersToRegistrationOptions.registrationOptionId],
      references: [registrationOptions.id],
    }),
    user: one(users, {
      fields: [usersToRegistrationOptions.userId],
      references: [users.id],
    }),
  }),
);

export type UsersToRegistrationOptions = typeof usersToRegistrationOptions.$inferSelect;
