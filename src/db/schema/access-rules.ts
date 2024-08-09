import { boolean, index, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';

export const accessRules = pgTable(
  'access_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: varchar('provider', { length: 256 }),
    subject: varchar('subject', { length: 256 }),
    isAllowed: boolean('is_allowed').default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    providerSubjectIndex: unique('access_rules_provider_subject_idx').on(t.provider, t.subject),
    isAllowedIndex: index('is_allowed_idx').on(t.isAllowed),
  }),
);

export type AccessRule = typeof accessRules.$inferSelect;
