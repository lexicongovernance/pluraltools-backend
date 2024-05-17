import { pgTable, timestamp, uuid, varchar, boolean } from 'drizzle-orm/pg-core';
import { events } from './events';
import { groups } from './groups';
import { usersToGroups } from './users-to-groups';
import { relations } from 'drizzle-orm';
import { questionsToGroupCategories } from './questions-to-group-categories';

export const groupCategories = pgTable('group_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name'),
  eventId: uuid('event_id').references(() => events.id),
  userCanCreate: boolean('user_can_create').notNull().default(false),
  userCanView: boolean('user_can_view').notNull().default(false),
  userCanLeave: boolean('user_can_leave').notNull().default(true),
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
