import { eq } from 'drizzle-orm';
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
