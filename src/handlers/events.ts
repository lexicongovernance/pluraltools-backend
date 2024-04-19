import { and, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';

export function getEventCyclesHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: 'Missing eventId' });
    }

    const eventCycles = await dbPool.query.cycles.findMany({
      where: eq(db.cycles.eventId, eventId),
      with: {
        forumQuestions: {
          with: {
            questionOptions: {
              where: eq(db.questionOptions.accepted, true),
            },
          },
        },
      },
    });

    return res.json({ data: eventCycles });
  };
}

export function getEventsHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const events = await dbPool.query.events.findMany();
    return res.json({ data: events });
  };
}

export function getEventHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: 'Missing eventId' });
    }

    const event = await dbPool.query.events.findFirst({
      where: eq(db.events.id, eventId),
    });

    return res.json({ data: event });
  };
}

export function getEventRegistrationFieldsHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const eventId = req.params.eventId;
    if (!eventId) {
      return res.status(400).json({ errors: ['eventId is required'] });
    }

    const event = await dbPool.query.events.findFirst({
      with: {
        registrationFields: {
          with: {
            registrationFieldOptions: true,
          },
        },
      },
      where: eq(db.events.id, eventId),
    });

    return res.json({ data: event?.registrationFields });
  };
}

export function getEventRegistrationsHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    // parse input
    const eventId = req.params.eventId ?? '';
    const userId = req.session.userId;

    try {
      const out = await dbPool.query.registrations.findMany({
        where: and(eq(db.registrations.userId, userId), eq(db.registrations.eventId, eventId)),
      });

      return res.json({ data: out });
    } catch (e) {
      console.log('error getting registration ' + e);
      return res.sendStatus(500);
    }
  };
}
