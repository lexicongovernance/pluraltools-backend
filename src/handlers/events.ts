import { and, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import { insertRegistrationSchema } from '../types';
import { validateRequiredRegistrationFields } from '../services/registrationFields';
import { saveEventRegistration } from '../services/registrations';

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
      where: (fields, { eq }) => eq(fields.id, eventId),
    });

    return res.json({ data: event?.registrationFields });
  };
}

export function saveEventRegistrationHandler(dbPool: PostgresJsDatabase<typeof db>) {
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

    const missingRequiredFields = await validateRequiredRegistrationFields(dbPool, body.data);

    if (missingRequiredFields.length > 0) {
      return res.status(400).json({ errors: missingRequiredFields });
    }

    try {
      const out = await saveEventRegistration(dbPool, body.data, userId);
      return res.json({ data: out });
    } catch (e) {
      console.log('error saving registration ' + e);
      return res.sendStatus(500);
    }
  };
}

export function getEventRegistrationHandler(dbPool: PostgresJsDatabase<typeof db>) {
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
