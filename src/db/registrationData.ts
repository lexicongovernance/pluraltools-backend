import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { registrationFields } from './registrationFields';
import { registrations } from './registrations';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const registrationData = pgTable('registration_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
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
  user: one(users, {
    fields: [registrationData.userId],
    references: [users.id],
  }),
  registration: one(registrations, {
    fields: [registrationData.registrationId],
    references: [registrations.id],
  }),
  registrationField: one(registrationFields, {
    fields: [registrationData.registrationFieldId],
    references: [registrationFields.id],
  }),
}));

export type RegistrationData = typeof registrationData.$inferSelect;
