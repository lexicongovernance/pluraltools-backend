import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { registrationFields } from './registrationFields';

export const registrationFieldOptions = pgTable('registration_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  registrationFieldId: uuid('registration_field_id')
    .references(() => registrationFields.id)
    .notNull(),
  value: varchar('value', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const registrationFieldOptionsRelations = relations(registrationFieldOptions, ({ one }) => ({
  registrationField: one(registrationFields),
}));

export type RegistrationFieldOption = typeof registrationFieldOptions.$inferSelect;
