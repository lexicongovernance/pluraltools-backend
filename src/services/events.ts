import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import { eq } from 'drizzle-orm';

export function getEvents(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const events = await dbPool.query.events.findMany();
    return res.json({ data: events });
  };
}

export function getEvent(dbPool: PostgresJsDatabase<typeof db>) {
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
