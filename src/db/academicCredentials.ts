import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { usersToAcademicCredentials } from './usersToAcademicCredentials';

export const academicCredentials = pgTable('academic_credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 256 }).notNull(),
  description: varchar('description', { length: 256 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const credentialsRelations = relations(academicCredentials, ({ many }) => ({
  usersToAcademicCredentials: many(usersToAcademicCredentials),
}));

export type AcademicCredentials = typeof academicCredentials.$inferSelect; // return type when queried
