import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { events } from './events';
import { relations } from 'drizzle-orm';

export const groupCategories = pgTable('group_category', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupCategoryLabel: varchar('group_category_label'),
  eventId: uuid('event_id')
    .references(() => events.id)
    .notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const groupCategoriesRelations = relations(groupCategories, ({ many }) => ({
  event: many(events),
}));

export type GroupCategory = typeof groupCategories.$inferSelect;
