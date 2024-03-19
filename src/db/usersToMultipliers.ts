import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { multipliers } from './multipliers';
import { relations } from 'drizzle-orm';

export const usersToMultipliers = pgTable('users_to_multipliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  multiplierId: uuid('multiplier_id')
    .notNull()
    .references(() => multipliers.id),
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
}));

export type UsersToMultipliers = typeof usersToMultipliers.$inferSelect;
