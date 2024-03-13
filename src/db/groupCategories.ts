import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { events } from './events';
import { groups } from './groups';
import { relations } from 'drizzle-orm';

export const groupCategories = pgTable('group_category', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupLabel: varchar('group_label'),
  eventId: uuid('event_id').references(() => events.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const groupCategoriesRelations = relations(groupCategories, ({ one, many }) => ({
  event: one(events, {
    fields: [groupCategories.eventId],
    references: [events.id],
  }),
  group: many(groups),
}));

export type GroupCategory = typeof groupCategories.$inferSelect;
