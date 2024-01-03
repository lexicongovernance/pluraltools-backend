import { boolean, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { registrations } from './registrations';
import { relations } from 'drizzle-orm';
import { registrationFieldOptions } from '.';

export const registrationFieldEnum = pgEnum('registration_field_enum', [
  'SELECT',
  'TEXT',
  'NUMBER',
  'DATE',
  'BOOLEAN',
]);

export const registrationFields = pgTable('registration_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  registrationId: uuid('registration_id')
    .references(() => registrations.id)
    .notNull(),
  name: varchar('name').notNull(),
  type: registrationFieldEnum('type').notNull(),
  isRequired: boolean('is_required').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// relations
export const registrationFieldsRelations = relations(registrationFields, ({ one, many }) => ({
  registration: one(registrations),
  registrationFieldOptions: many(registrationFieldOptions),
}));
