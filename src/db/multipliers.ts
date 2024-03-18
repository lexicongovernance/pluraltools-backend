import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { usersToMultipliers } from './usersToMultipliers';
import { multiplierCategories } from './multiplierCategories';

export const multipliers = pgTable('multipliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 256 }).notNull(),
  description: varchar('description', { length: 256 }),
  multiplierCategoryId: uuid('multiplier_category_id').references(() => multiplierCategories.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const multipliersRelations = relations(multipliers, ({ one, many }) => ({
  multiplierCategory: one(multiplierCategories, {
    fields: [multipliers.multiplierCategoryId],
    references: [multiplierCategories.id],
  }),
  usersToMultipliers: many(usersToMultipliers),
}));

export type Multiplier = typeof multipliers.$inferSelect;
