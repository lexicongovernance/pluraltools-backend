import { relations } from 'drizzle-orm';
import { boolean, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { events, registrationData, registrationFieldOptions } from '.';

export const registrationFieldEnum = pgEnum('registration_field_enum', [
  'SELECT',
  'TEXT',
  'NUMBER',
  'DATE',
  'BOOLEAN',
]);

export const registrationFields = pgTable('registration_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id')
    .references(() => events.id)
    .notNull(),
  name: varchar('name').notNull(),
  description: varchar('description'),
  type: registrationFieldEnum('type').notNull(),
  required: boolean('required').default(false),
  questionId: uuid('question_id').defaultRandom(),
  optionQuestionId: boolean('option_question_id').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const registrationFieldsRelations = relations(registrationFields, ({ one, many }) => ({
  event: one(events, {
    fields: [registrationFields.eventId],
    references: [events.id],
  }),
  registrationFieldOptions: many(registrationFieldOptions),
  registrationData: many(registrationData),
}));

export type RegistrationField = typeof registrationFields.$inferSelect; // return type when queried
