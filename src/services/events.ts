import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { z } from 'zod';
import * as db from '../db';
import { fieldsSchema, insertRegistrationSchema } from '../types';
import { eq } from 'drizzle-orm';
import { enforceRules } from './validation';

export async function validateEventFields({
  registration,
  dbPool,
}: {
  dbPool: NodePgDatabase<typeof db>;
  registration: z.infer<typeof insertRegistrationSchema>;
}) {
  const rows = await dbPool.select().from(db.events).where(eq(db.events.id, registration.eventId));

  if (!rows.length) {
    return [];
  }

  const event = rows[0];

  if (!event) {
    return [];
  }

  // get fields for the event
  const eventFields = fieldsSchema.safeParse(event.fields);

  if (!eventFields.success) {
    return [];
  }

  return enforceRules({
    data: registration.data,
    fields: eventFields.data,
  });
}
