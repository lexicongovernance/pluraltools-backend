import { boolean, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  active: boolean('active').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Alert = typeof alerts.$inferSelect;
