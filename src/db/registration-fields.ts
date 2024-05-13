import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { events, registrationData, registrationFieldOptions } from '.';

export const registrationFields = pgTable('registration_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id')
    .references(() => events.id)
    .notNull(),
  name: varchar('name').notNull(),
  description: varchar('description'),
  // CAN BE: TEXT, NUMBER, SELECT, RADIO, CHECKBOX, TEXTAREA AND MORE
  type: varchar('type').notNull().default('TEXT'),
  required: boolean('required').default(false),
  fieldDisplayRank: integer('fields_display_rank'),
  characterLimit: integer('character_limit').default(0),
  forGroup: boolean('for_group').default(false),
  forUser: boolean('for_user').default(true),
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

export type RegistrationField = typeof registrationFields.$inferSelect;
