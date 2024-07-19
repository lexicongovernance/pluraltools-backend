import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { z } from 'zod';
import * as schema from '../db/schema';
import { fieldsSchema, insertRegistrationSchema } from '../types';
import { enforceRules } from './validation';

export async function getUserRegistration({
  dbPool,
  registrationId,
  userId,
}: {
  dbPool: NodePgDatabase<typeof schema>;
  userId: string;
  registrationId: string;
}): Promise<schema.Registration | null> {
  const existingRegistration = await dbPool.query.registrations.findFirst({
    where: and(
      eq(schema.registrations.userId, userId),
      eq(schema.registrations.id, registrationId),
    ),
  });

  if (!existingRegistration) {
    return null;
  }

  return existingRegistration;
}

export async function validateEventFields({
  registration,
  dbPool,
}: {
  dbPool: NodePgDatabase<typeof schema>;
  registration: z.infer<typeof insertRegistrationSchema>;
}) {
  const rows = await dbPool
    .select()
    .from(schema.events)
    .where(eq(schema.events.id, registration.eventId));

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

export async function saveRegistration(
  dbPool: NodePgDatabase<typeof schema>,
  registration: z.infer<typeof insertRegistrationSchema>,
) {
  const event = await dbPool.query.events.findFirst({
    where: eq(schema.events.id, registration.eventId),
  });

  if (!event) {
    throw new Error('event not found');
  }

  const newRegistration = await createRegistrationInDB(dbPool, {
    ...registration,
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
  dbPool: NodePgDatabase<typeof schema>;
  data: z.infer<typeof insertRegistrationSchema>;
  registration: schema.Registration;
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
  dbPool: NodePgDatabase<typeof schema>,
  body: z.infer<typeof insertRegistrationSchema>,
) {
  // insert to registration table
  const newRegistration = await dbPool
    .insert(schema.registrations)
    .values({
      userId: body.userId,
      groupId: body.groupId,
      eventId: body.eventId,
      data: body.data,
      status: body.status,
    })
    .returning();
  return newRegistration[0];
}

async function updateRegistrationInDB(
  dbPool: NodePgDatabase<typeof schema>,
  registration: schema.Registration,
  body: z.infer<typeof insertRegistrationSchema>,
) {
  const updatedRegistration = await dbPool
    .update(schema.registrations)
    .set({
      eventId: body.eventId,
      groupId: body.groupId,
      data: body.data,
      updatedAt: new Date(),
    })
    .where(eq(schema.registrations.id, registration.id))
    .returning();
  return updatedRegistration[0];
}

export async function validateRegistrationData({
  registration,
  dbPool,
}: {
  dbPool: NodePgDatabase<typeof schema>;
  registration: z.infer<typeof insertRegistrationSchema>;
}) {
  const rows = await dbPool
    .select()
    .from(schema.events)
    .where(eq(schema.events.id, registration.eventId));

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
