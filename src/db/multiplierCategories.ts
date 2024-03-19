import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { events } from './events';
import { multipliers } from './multipliers';
import { usersToMultipliers } from './usersToMultipliers';
import { relations } from 'drizzle-orm';

export const multiplierCategories = pgTable('multiplier_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  multiplierCategory: varchar('multiplier_category').notNull(),
  eventId: uuid('event_id').references(() => events.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const multiplierCategoriesRelations = relations(multiplierCategories, ({ one, many }) => ({
  event: one(events, {
    fields: [multiplierCategories.eventId],
    references: [events.id],
  }),
  multiplier: many(multipliers),
  usersToMultiplier: many(usersToMultipliers),
}));

export type MultiplierCategory = typeof multiplierCategories.$inferSelect;
