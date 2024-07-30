import { and, eq, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';
import * as schema from '../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { logger } from '../utils/logger';

export function getEventCyclesHandler(dbPool: NodePgDatabase<typeof schema>) {
  return async function (req: Request, res: Response) {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: 'Missing eventId' });
    }

    const eventCycles = await dbPool.query.cycles.findMany({
      where: eq(schema.cycles.eventId, eventId),
      with: {
        questions: {
          with: {
            options: {
              columns: {
                voteScore: false,
              },
              where: eq(schema.options.show, true),
            },
          },
        },
      },
    });

    return res.json({ data: eventCycles });
  };
}

export function getEventGroupCategoriesHandler(dbPool: NodePgDatabase<typeof schema>) {
  return async function (req: Request, res: Response) {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: 'Missing eventId' });
    }

    const eventGroupCategories = await dbPool.query.groupCategories.findMany({
      where: eq(schema.groupCategories.eventId, eventId),
    });

    return res.json({ data: eventGroupCategories });
  };
}

export function getEventsHandler(dbPool: NodePgDatabase<typeof schema>) {
  return async function (req: Request, res: Response) {
    const events = await dbPool.query.events.findMany({
      extras: {
        status: sql<string>`
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM ${schema.cycles}
              WHERE ${schema.cycles.eventId} = ${schema.events.id}
                AND ${schema.cycles.status} = 'OPEN'
            ) THEN 'OPEN'
            WHEN EXISTS (
              SELECT 1
              FROM ${schema.cycles}
              WHERE ${schema.cycles.eventId} = ${schema.events.id}
                AND ${schema.cycles.status} = 'UPCOMING'
            ) THEN 'UPCOMING'
            ELSE 'CLOSED'
          END
        `.as('status'),
      },
    });
    return res.json({ data: events });
  };
}

export function getEventHandler(dbPool: NodePgDatabase<typeof schema>) {
  return async function (req: Request, res: Response) {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: 'Missing eventId' });
    }

    const event = await dbPool.query.events.findFirst({
      where: eq(schema.events.id, eventId),
    });

    return res.json({ data: event });
  };
}

export function getEventRegistrationFieldsHandler(dbPool: NodePgDatabase<typeof schema>) {
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
      where: eq(schema.events.id, eventId),
    });

    return res.json({ data: event?.registrationFields });
  };
}

export function getEventRegistrationsHandler(dbPool: NodePgDatabase<typeof schema>) {
  return async function (req: Request, res: Response) {
    // parse input
    const eventId = req.params.eventId ?? '';
    const userId = req.session.userId;

    try {
      const out = await dbPool.query.registrations.findMany({
        where: and(
          eq(schema.registrations.userId, userId),
          eq(schema.registrations.eventId, eventId),
        ),
      });

      return res.json({ data: out });
    } catch (e) {
      logger.error('error getting registration ' + e);
      return res.sendStatus(500);
    }
  };
}
