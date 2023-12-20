import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { cycles } from './cycles'; // Assuming your cycles file is in the same directory
import { relations } from 'drizzle-orm';

export const options = pgTable('options', {
  id: uuid('id').primaryKey().defaultRandom(),
  cycleId: uuid('cycle_id')
    .references(() => cycles.id) // Assuming cycles has an 'id' field
    .notNull(),
  text: varchar('text', { length: 256 }).notNull(),
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
