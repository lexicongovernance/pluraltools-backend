import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { multipliers } from './multipliers';
import { relations } from 'drizzle-orm';
import { multiplierCategories } from './multiplierCategories';

export const usersToMultipliers = pgTable('users_to_multipliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  multiplierId: uuid('multiplier_id')
    .notNull()
    .references(() => multipliers.id),
  multiplierCategoryId: uuid('multiplier_category_id').references(() => multiplierCategories.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const usersTomultipliersRelations = relations(usersToMultipliers, ({ one }) => ({
  multiplier: one(multipliers, {
    fields: [usersToMultipliers.multiplierId],
    references: [multipliers.id],
  }),
  user: one(users, {
    fields: [usersToMultipliers.userId],
    references: [users.id],
  }),
  multiplierCategory: one(multiplierCategories, {
    fields: [usersToMultipliers.multiplierCategoryId],
    references: [multiplierCategories.id],
  }),
}));

export type UsersToMultipliers = typeof usersToMultipliers.$inferSelect;
