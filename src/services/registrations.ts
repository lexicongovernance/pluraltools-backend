import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import { and, ne } from 'drizzle-orm';
import { z } from 'zod';
import { insertRegistrationSchema } from '../types';
import * as db from '../db';
import { overwriteRegistrationData } from './registrationData';

export function saveRegistration(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    // parse input
    const eventId = req.params.eventId;
    const userId = req.session.userId;
    req.body.userId = userId;
    req.body.eventId = eventId;
    const body = insertRegistrationSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({ errors: body.error.issues });
    }

    try {
      const out = await sendRegistrationData(dbPool, body.data, userId);
      return res.json({ data: out });
    } catch (e) {
      console.log('error saving registration ' + JSON.stringify(e));
      return res.sendStatus(500);
    }
  };
}

export async function sendRegistrationData(
  dbPool: PostgresJsDatabase<typeof db>,
  data: z.infer<typeof insertRegistrationSchema>,
  userId: string,
) {
  const existingRegistration = await dbPool.query.registrations.findFirst({
    where: and(eq(db.registrations.userId, userId), eq(db.registrations.eventId, data.eventId)),
  });
  const newRegistration = await upsertRegistration(dbPool, existingRegistration, data);
  if (!newRegistration) {
    throw new Error('Error saving registration');
  }
  const updatedRegistrationData = await overwriteRegistrationData({
    dbPool,
    registrationId: newRegistration.id,
    registrationData: data.registrationData,
  });

  const out = {
    ...newRegistration,
    registrationData: updatedRegistrationData,
  };

  return out;
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
