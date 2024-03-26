import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar, numeric } from 'drizzle-orm/pg-core';
import { usersToMultipliers } from './usersToMultipliers';

export const multipliers = pgTable('multipliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: varchar('label').notNull(),
  multiplier: numeric('multiplier').notNull().default('1.0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const multipliersRelations = relations(multipliers, ({ many }) => ({
  usersToMultipliers: many(usersToMultipliers),
}));

export type Multiplier = typeof multipliers.$inferSelect;
