import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import { and } from 'drizzle-orm';
import { z } from 'zod';
import { insertRegistrationSchema } from '../types';
import * as db from '../db';
import {
  upsertRegistrationData,
  upsertQuestionOptionFromRegistrationData,
} from './registrationData';

export function getUserRegistrations(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    // parse input
    const userId = req.session.userId;

    try {
      const out = await dbPool
        .select()
        .from(db.registrations)
        .where(eq(db.registrations.userId, userId));

      return res.json({ data: out });
    } catch (e) {
      console.log('error getting user registrations ' + e);
      return res.sendStatus(500);
    }
  };
}

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
