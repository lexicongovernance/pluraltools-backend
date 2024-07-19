import { boolean, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 256 }).notNull(),
  description: varchar('description', { length: 1024 }),
  link: varchar('link', { length: 256 }),
  startAt: timestamp('start_at'),
  endAt: timestamp('end_at'),
  active: boolean('active').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Alert = typeof alerts.$inferSelect;
