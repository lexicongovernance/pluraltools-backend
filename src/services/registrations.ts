import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { and } from 'drizzle-orm';
import { z } from 'zod';
import { insertRegistrationSchema } from '../types';
import * as db from '../db';
import {
  upsertRegistrationData,
  upsertQuestionOptionFromRegistrationData,
} from './registrationData';

export async function saveEventRegistration(
  dbPool: PostgresJsDatabase<typeof db>,
  data: z.infer<typeof insertRegistrationSchema>,
  userId: string,
) {
  const existingRegistration = await dbPool.query.registrations.findFirst({
    where: and(eq(db.registrations.userId, userId), eq(db.registrations.eventId, data.eventId)),
  });
  const newRegistration = await upsertRegistration(dbPool, existingRegistration, data);
  if (!newRegistration) {
    throw new Error('failed to save registration');
  }

  const updatedRegistrationData = await upsertRegistrationData({
    dbPool,
    registrationId: newRegistration.id,
    registrationData: data.registrationData,
  });

  try {
    await upsertQuestionOptionFromRegistrationData(dbPool, userId, updatedRegistrationData);

    const out = {
      ...newRegistration,
      registrationData: updatedRegistrationData,
    };

    return out;
  } catch (error) {
    console.error('Error in updateQuestionOptions: ', error);
    throw new Error('Failed to update question options');
  }
}

async function upsertRegistration(
  dbPool: PostgresJsDatabase<typeof db>,
  registration: db.Registration | undefined,
  body: z.infer<typeof insertRegistrationSchema>,
) {
  if (registration) {
    const updatedRegistration = await dbPool
      .update(db.registrations)
      .set({
        userId: body.userId,
        eventId: body.eventId,
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(db.registrations.id, registration.id))
      .returning();
    return updatedRegistration[0];
  } else {
    // insert to registration table
    const newRegistration = await dbPool
      .insert(db.registrations)
      .values({
        userId: body.userId,
        eventId: body.eventId,
        status: body.status,
      })
      .returning();
    return newRegistration[0];
  }
}
