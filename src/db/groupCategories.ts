import { pgTable, timestamp, uuid, varchar, boolean } from 'drizzle-orm/pg-core';
import { events } from './events';
import { groups } from './groups';
import { usersToGroups } from './usersToGroups';
import { relations } from 'drizzle-orm';
import { questionsToGroupCategories } from './questionsToGroupCategories';

export const groupCategories = pgTable('group_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name'),
  eventId: uuid('event_id').references(() => events.id),
  private: boolean('private').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const groupCategoriesRelations = relations(groupCategories, ({ one, many }) => ({
  event: one(events, {
    fields: [groupCategories.eventId],
    references: [events.id],
  }),
  group: many(groups),
  usersToGroup: many(usersToGroups),
  questionsToGroupCategories: many(questionsToGroupCategories),
}));

export type GroupCategory = typeof groupCategories.$inferSelect;
