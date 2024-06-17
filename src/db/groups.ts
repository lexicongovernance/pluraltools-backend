import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { usersToGroups } from './users-to-groups';
import { groupCategories } from './group-categories';
import { registrations } from './registrations';

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 256 }).notNull(),
  description: varchar('description', { length: 256 }),
  secret: varchar('secret', { length: 256 }).unique(),
  groupCategoryId: uuid('group_category_id')
    .references(() => groupCategories.id)
    .notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const groupsRelations = relations(groups, ({ one, many }) => ({
  groupCategory: one(groupCategories, {
    fields: [groups.groupCategoryId],
    references: [groupCategories.id],
  }),
  registrations: many(registrations),
  usersToGroups: many(usersToGroups),
}));

export type Group = typeof groups.$inferSelect;
