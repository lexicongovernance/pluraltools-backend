import { pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from '.';
import { relations } from 'drizzle-orm';

export const federatedCredentials = pgTable(
  'federated_credentials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    provider: varchar('provider', { length: 256 }),
    subject: varchar('subject', { length: 256 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    providerSubjectIndex: unique('provider_subject_idx').on(t.provider, t.subject),
  }),
);

export const federatedCredentialsRelations = relations(federatedCredentials, ({ one }) => ({
  user: one(users, {
    fields: [federatedCredentials.userId],
    references: [users.id],
  }),
}));

export type FederatedCredential = typeof federatedCredentials.$inferSelect;
