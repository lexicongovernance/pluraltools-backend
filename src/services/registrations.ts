import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { z } from 'zod';
import * as db from '../db';
import { fieldsSchema, insertRegistrationSchema } from '../types';
import { enforceRules } from './validation';

export async function getUserRegistration({
  dbPool,
  registrationId,
  userId,
}: {
  dbPool: NodePgDatabase<typeof db>;
  userId: string;
  registrationId: string;
}): Promise<db.Registration | null> {
  const existingRegistration = await dbPool.query.registrations.findFirst({
    where: and(eq(db.registrations.userId, userId), eq(db.registrations.id, registrationId)),
  });

  if (!existingRegistration) {
    return null;
  }

  return existingRegistration;
}

export async function saveRegistration(
  dbPool: NodePgDatabase<typeof db>,
  data: z.infer<typeof insertRegistrationSchema>,
) {
  const event = await dbPool.query.events.findFirst({
    where: eq(db.events.id, data.eventId),
  });

  const newRegistration = await createRegistrationInDB(dbPool, {
    ...data,
    status: event?.requireApproval ? 'DRAFT' : 'APPROVED',
  });

  if (!newRegistration) {
    throw new Error('failed to save registration');
  }

  const out = {
    ...newRegistration,
  };

  return out;
}

export async function updateRegistration({
  data,
  dbPool,
  registration,
}: {
  dbPool: NodePgDatabase<typeof db>;
  data: z.infer<typeof insertRegistrationSchema>;
  registration: db.Registration;
}) {
  const updatedRegistration = await updateRegistrationInDB(dbPool, registration, data);

  if (!updatedRegistration) {
    throw new Error('failed to save registration');
  }

  const out = {
    ...updatedRegistration,
  };

  return out;
}

async function createRegistrationInDB(
  dbPool: NodePgDatabase<typeof db>,
  body: z.infer<typeof insertRegistrationSchema>,
) {
  // insert to registration table
  const newRegistration = await dbPool
    .insert(db.registrations)
    .values({
      userId: body.userId,
      groupId: body.groupId,
      eventId: body.eventId,
      status: body.status,
    })
    .returning();
  return newRegistration[0];
}

async function updateRegistrationInDB(
  dbPool: NodePgDatabase<typeof db>,
  registration: db.Registration,
  body: z.infer<typeof insertRegistrationSchema>,
) {
  const updatedRegistration = await dbPool
    .update(db.registrations)
    .set({
      eventId: body.eventId,
      groupId: body.groupId,
      updatedAt: new Date(),
    })
    .where(eq(db.registrations.id, registration.id))
    .returning();
  return updatedRegistration[0];
}

export async function validateRegistrationData({
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
