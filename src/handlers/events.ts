import { and, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import * as db from '../db';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export function getEventCyclesHandler(dbPool: NodePgDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: 'Missing eventId' });
    }

    const eventCycles = await dbPool.query.cycles.findMany({
      where: eq(db.cycles.eventId, eventId),
      with: {
        questions: {
          with: {
            options: {
              columns: {
                voteScore: false,
              },
              where: eq(db.options.accepted, true),
            },
          },
        },
      },
    });

    return res.json({ data: eventCycles });
  };
}

export function getEventGroupCategoriesHandler(dbPool: NodePgDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: 'Missing eventId' });
    }

    const eventGroupCategories = await dbPool.query.groupCategories.findMany({
      where: eq(db.groupCategories.eventId, eventId),
    });

    return res.json({ data: eventGroupCategories });
  };
}

export function getEventsHandler(dbPool: NodePgDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const events = await dbPool.query.events.findMany();
    return res.json({ data: events });
  };
}

export function getEventHandler(dbPool: NodePgDatabase<typeof db>) {
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

export function getEventRegistrationFieldsHandler(dbPool: NodePgDatabase<typeof db>) {
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

export function getEventRegistrationsHandler(dbPool: NodePgDatabase<typeof db>) {
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
