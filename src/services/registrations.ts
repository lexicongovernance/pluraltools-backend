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

    // check if all required fields are filled
    const event = await dbPool.query.events.findFirst({
      with: {
        registrationFields: true,
      },
      where: (event, { eq }) => eq(event.id, body.data.eventId),
    });
    const requiredFields = event?.registrationFields.filter((field) => field.required);

    // loop through required fields and check if they are filled
    if (requiredFields) {
      const missingFields = requiredFields.filter(
        (field) =>
          !body.data.registrationData.some((data) => data.registrationFieldId === field.id),
      );

      if (missingFields.length > 0) {
        return res.status(400).json({
          errors: missingFields.map((field) => ({
            field: field.name,
            message: 'missing required field',
          })),
        });
      }
    }

    try {
      const out = await sendRegistrationData(dbPool, body.data, userId);
      return res.json({ data: out });
    } catch (e) {
      console.log('error saving registration ' + e);
      return res.sendStatus(500);
    }
  };
}

export function getRegistration(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    // parse input
    const eventId = req.params.eventId ?? '';
    const userId = req.session.userId;

    try {
      const out = await dbPool.query.registrations.findFirst({
        where: and(eq(db.registrations.userId, userId), eq(db.registrations.eventId, eventId)),
      });

      return res.json({ data: out });
    } catch (e) {
      console.log('error getting registration ' + e);
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
    throw new Error('failed to save registration');
  }

  const updatedRegistrationData = await upsertRegistrationData({
    dbPool,
    registrationId: newRegistration.id,
    registrationData: data.registrationData,
  });

  try {
    await upsertQuestionOptionFromRegistrationData(dbPool, updatedRegistrationData);

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
