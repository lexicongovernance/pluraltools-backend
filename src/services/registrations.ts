import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { insertRegistrationSchema } from '../types';
import * as db from '../db';
import { upsertRegistrationData } from './registration-data';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export async function validateCreateRegistrationPermissions({
  dbPool,
  userId,
  groupId,
}: {
  dbPool: NodePgDatabase<typeof db>;
  userId: string;
  groupId?: string | null;
}) {
  if (groupId) {
    const userGroup = dbPool.query.usersToGroups.findFirst({
      where: and(eq(db.usersToGroups.userId, userId), eq(db.usersToGroups.groupId, groupId)),
    });

    if (!userGroup) {
      return false;
    }
  }

  return true;
}

export async function validateUpdateRegistrationPermissions({
  dbPool,
  registrationId,
  userId,
  groupId,
}: {
  dbPool: NodePgDatabase<typeof db>;
  userId: string;
  registrationId: string;
  groupId?: string | null;
}) {
  const existingRegistration = await dbPool.query.registrations.findFirst({
    where: and(eq(db.registrations.userId, userId), eq(db.registrations.id, registrationId)),
  });

  if (!existingRegistration) {
    return false;
  }

  if (existingRegistration.userId !== userId) {
    return false;
  }

  if (groupId) {
    const userGroup = dbPool.query.usersToGroups.findFirst({
      where: and(eq(db.usersToGroups.userId, userId), eq(db.usersToGroups.groupId, groupId)),
    });

    if (!userGroup) {
      return false;
    }
  }

  return true;
}

export async function saveRegistration(
  dbPool: NodePgDatabase<typeof db>,
  data: z.infer<typeof insertRegistrationSchema>,
) {
  const newRegistration = await createRegistrationInDB(dbPool, data);
  if (!newRegistration) {
    throw new Error('failed to save registration');
  }

  const updatedRegistrationData = await upsertRegistrationData({
    dbPool,
    registrationId: newRegistration.id,
    registrationData: data.registrationData,
  });

  if (!updatedRegistrationData) {
    throw new Error('Failed to upsert registration data');
  }

  const out = {
    ...newRegistration,
    registrationData: updatedRegistrationData,
  };

  return out;
}

export async function updateRegistration({
  data,
  dbPool,
  registrationId,
  userId,
}: {
  dbPool: NodePgDatabase<typeof db>;
  data: z.infer<typeof insertRegistrationSchema>;
  registrationId: string;
  userId: string;
}) {
  const existingRegistration = await dbPool.query.registrations.findFirst({
    where: and(eq(db.registrations.userId, userId), eq(db.registrations.id, registrationId)),
  });

  if (!existingRegistration) {
    throw new Error('registration not found');
  }

  const updatedRegistration = await updateRegistrationInDB(dbPool, existingRegistration, data);

  if (!updatedRegistration) {
    throw new Error('failed to save registration');
  }

  const updatedRegistrationData = await upsertRegistrationData({
    dbPool,
    registrationId: updatedRegistration.id,
    registrationData: data.registrationData,
  });

  if (!updatedRegistrationData) {
    throw new Error('Failed to upsert registration data');
  }

  const out = {
    ...updatedRegistration,
    registrationData: updatedRegistrationData,
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
