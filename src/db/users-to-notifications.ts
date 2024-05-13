import { boolean, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { notificationTypes } from './notification-types';
import { relations } from 'drizzle-orm';

export const usersToNotifications = pgTable('users_to_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  notificationTypeId: uuid('notification_type_id').references(() => notificationTypes.id),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type UsersToNotification = typeof usersToNotifications.$inferSelect;

export const usersToNotificationsRelations = relations(usersToNotifications, ({ one }) => ({
  user: one(users, {
    fields: [usersToNotifications.userId],
    references: [users.id],
  }),
  notificationType: one(notificationTypes, {
    fields: [usersToNotifications.notificationTypeId],
    references: [notificationTypes.id],
  }),
}));
