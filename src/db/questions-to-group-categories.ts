import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { groupCategories } from './group-categories';
import { forumQuestions } from './forum-questions';

export const questionsToGroupCategories = pgTable('questions_to_group_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id')
    .notNull()
    .references(() => forumQuestions.id),
  groupCategoryId: uuid('group_category_id').references(() => groupCategories.id), // Must be nullable (for now) because affiliation does not have a group category id.
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const questionsToGroupCategoriesRelations = relations(
  questionsToGroupCategories,
  ({ one }) => ({
    question: one(forumQuestions, {
      fields: [questionsToGroupCategories.questionId],
      references: [forumQuestions.id],
    }),
    groupCategory: one(groupCategories, {
      fields: [questionsToGroupCategories.groupCategoryId],
      references: [groupCategories.id],
    }),
  }),
);

export type QuestionsToGroupCategories = typeof questionsToGroupCategories.$inferSelect;
