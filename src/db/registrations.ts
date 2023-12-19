import { pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';
import { relations } from 'drizzle-orm';

export const registrationEnum = pgEnum('registration_enum', ['DRAFT', 'PUBLISHED']);

export const registrations = pgTable('registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  username: varchar('username', { length: 256 }).unique(),
  email: varchar('email', { length: 256 }).unique(),
  proposalTitle: varchar('proposal_title', { length: 256 }).notNull(),
  proposalAbstract: varchar('proposal_abstract'),
  status: registrationEnum('status').default('DRAFT'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const registrationRelations = relations(registrations, ({ one }) => ({
  user: one(users, {
    fields: [registrations.userId],
    references: [users.id],
  }),
}));

export type Registration = typeof registrations.$inferSelect; // return type when queried
