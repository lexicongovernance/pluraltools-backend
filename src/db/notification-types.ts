import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const notificationTypes = pgTable('notification_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  value: varchar('value', { length: 256 }).unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type NotificationType = typeof notificationTypes.$inferSelect;
