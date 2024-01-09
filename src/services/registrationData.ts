import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq } from 'drizzle-orm';
import type { Request, Response } from 'express';

export function getRegistrationData(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const eventId = req.params.eventId;
    const userId = req.session.userId;
    console.log({ userId });
    if (!userId) {
      return res.status(400).json({ errors: ['userId is required'] });
    }

    if (!eventId) {
      return res.status(400).json({ errors: ['eventId is required'] });
    }

    const event = await dbPool.query.events.findFirst({
      with: {
        registrations: {
          with: {
            registrationData: true,
          },
          where: (fields, { eq }) => eq(fields.userId, userId),
        },
      },
      where: (fields, { eq }) => eq(fields.id, eventId),
    });

    const out = event?.registrations.map((registration) => registration.registrationData).flat();

    return res.json({ data: out });
  };
}

export async function overwriteRegistrationData({
  dbPool,
  registrationData,
  registrationId,
}: {
  dbPool: PostgresJsDatabase<typeof db>;
  registrationId: string;
  registrationData: {
    registrationFieldId: string;
    value: string;
  }[];
}): Promise<db.RegistrationData[] | null> {
  // delete all groups that previously existed
  try {
    await dbPool
      .delete(db.registrationData)
      .where(eq(db.registrationData.registrationId, registrationId));
  } catch (e) {
    console.log('error deleting registration data ' + JSON.stringify(e));
    return null;
  }

  if (!registrationData.length) {
    return [];
  }

  // save the new ones
  const newRegistrationData = await dbPool
    .insert(db.registrationData)
    .values(
      registrationData.map((data) => ({
        registrationId,
        registrationFieldId: data.registrationFieldId,
        value: data.value,
      })),
    )
    .returning();
  // return new registration data
  return newRegistrationData;
}
