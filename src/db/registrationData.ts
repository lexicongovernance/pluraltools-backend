import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { registrationFields } from './registrationFields';
import { registrations } from './registrations';
import { relations } from 'drizzle-orm';

export const registrationData = pgTable('registration_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  registrationId: uuid('registration_id')
    .references(() => registrations.id)
    .notNull(),
  registrationFieldId: uuid('registration_field_id')
    .references(() => registrationFields.id)
    .notNull(),
  value: varchar('value').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const registrationDataRelations = relations(registrationData, ({ one }) => ({
  registration: one(registrations),
  registrationField: one(registrationFields),
}));
