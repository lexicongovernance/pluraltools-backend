import { pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

export const cyclesEnum = pgEnum('cycles_enum', ['OPEN', 'CLOSED', 'RESULTS']);

export const cycles = pgTable('cycles', {
  id: uuid('id').primaryKey().defaultRandom(),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  status: cyclesEnum('status').default('OPEN'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Cycles = typeof cycles.$inferSelect;
