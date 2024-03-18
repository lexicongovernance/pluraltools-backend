import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { groups } from './groups';
import { relations } from 'drizzle-orm';
import { groupCategories } from './groupCategories';

export const usersToGroups = pgTable('users_to_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  groupId: uuid('group_id')
    .notNull()
    .references(() => groups.id),
  groupCategoryId: uuid('group_category_id').references(() => groupCategories.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const usersToGroupsRelations = relations(usersToGroups, ({ one }) => ({
  group: one(groups, {
    fields: [usersToGroups.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [usersToGroups.userId],
    references: [users.id],
  }),
  groupCategory: one(groupCategories, {
    fields: [usersToGroups.groupCategoryId],
    references: [groupCategories.id],
  }),
}));

export type UsersToGroups = typeof usersToGroups.$inferSelect;
