import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from '.';

export const userAttributes = pgTable('user_attributes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  attributeKey: varchar('attribute_key').notNull(),
  attributeValue: varchar('attribute_value').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userAttributeRelations = relations(userAttributes, ({ one }) => ({
  user: one(users, {
    fields: [userAttributes.userId],
    references: [users.id],
  }),
}));

export type UserAttribute = typeof userAttributes.$inferSelect; // return type when queried
