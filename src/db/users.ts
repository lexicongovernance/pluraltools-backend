import { pgTable, serial, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';

export const users = pgTable('users', {
    id: uuid('id').primaryKey(),
    username: varchar('username', { length: 256 }).unique().notNull(),
    email: varchar('email', { length: 256 }).unique().notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect; // return type when queried
