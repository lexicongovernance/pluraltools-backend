import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { events, forumQuestions, registrationData, registrationFieldOptions } from '.';
import { groupCategories } from './groupCategories';

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
  questionId: uuid('question_id').references(() => forumQuestions.id),
  // CAN BE: NULL, TITLE, OR SUBTITLE
  questionOptionType: varchar('question_option_type'),
  groupLabelId: uuid('group_label_id').references(() => groupCategories.id),
  fieldDisplayRank: integer('fields_display_rank'),
  characterLimit: integer('character_limit').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const registrationFieldsRelations = relations(registrationFields, ({ one, many }) => ({
  event: one(events, {
    fields: [registrationFields.eventId],
    references: [events.id],
  }),
  forumQuestion: one(forumQuestions, {
    fields: [registrationFields.questionId],
    references: [forumQuestions.id],
  }),
  groupCategory: one(groupCategories, {
    fields: [registrationFields.groupLabelId],
    references: [groupCategories.id],
  }),
  registrationFieldOptions: many(registrationFieldOptions),
  registrationData: many(registrationData),
}));

export type RegistrationField = typeof registrationFields.$inferSelect;
