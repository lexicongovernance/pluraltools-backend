import { pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

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
  status: registrationEnum('status'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Registration = typeof registrations.$inferSelect; // return type when queried
