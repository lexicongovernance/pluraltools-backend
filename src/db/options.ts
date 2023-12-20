import { pgTable, timestamp, integer, uuid, varchar } from 'drizzle-orm/pg-core';
import { cycles } from './cycles';
import { relations } from 'drizzle-orm';

export const options = pgTable('options', {
  id: uuid('id').primaryKey().defaultRandom(),
  cycleId: uuid('id')
    .references(() => cycles.id)
    .notNull(),
  text: varchar('text', { length: 256 }).notNull(),
  voteCount: integer('vote_count').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const optionsRelations = relations(options, ({ one }) => ({
  cycle: one(cycles, {
    fields: [options.cycleId],
    references: [cycles.id],
  }),
}));

export type Option = typeof options.$inferSelect;
