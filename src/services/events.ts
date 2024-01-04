import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';

export function getEvents(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const events = await dbPool.query.events.findMany();
    return res.json({ data: events });
  };
}

export function getRegistrationFields(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const eventId = req.params.eventId;
    if (!eventId) {
      return res.status(400).json({ errors: ['eventId is required'] });
    }

    const registrationFields = await dbPool.query.events.findMany({
      with: {
        registrationFields: {
          with: {
            registrationFieldOptions: true,
          },
        },
      },
      where: (fields, { eq }) => eq(fields.id, eventId),
    });

    return res.json({ data: registrationFields });
  };
}

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

    const registrationData = await dbPool.query.events.findMany({
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

    return res.json({ data: registrationData });
  };
}
