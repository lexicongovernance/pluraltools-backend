import { boolean, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { events } from './events';
import { relations } from 'drizzle-orm';

export const navLinks = pgTable('nav_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 256 }).notNull(),
  description: varchar('description', { length: 1024 }),
  link: varchar('link', { length: 256 }),
  startAt: timestamp('start_at'),
  endAt: timestamp('end_at'),
  active: boolean('active').default(false),
  eventId: uuid('event_id').references(() => events.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const navLinksRelations = relations(navLinks, ({ one }) => ({
  event: one(events, {
    fields: [navLinks.eventId],
    references: [events.id],
  }),
}));

export type NavLink = typeof navLinks.$inferSelect;
