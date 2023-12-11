import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from '.';

export const federatedCredentials = pgTable('federated_credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  provider: varchar('provider', { length: 256 }),
  subject: varchar('subject', { length: 256 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type FederatedCredential = typeof federatedCredentials.$inferSelect; // return type when queried
