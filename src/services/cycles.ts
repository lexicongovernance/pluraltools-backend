import { and, gte, lte } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';

export function getActiveCycles(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const activeCycles = await dbPool.query.cycles.findMany({
      where: and(lte(db.cycles.startAt, new Date()), gte(db.cycles.endAt, new Date())),
      with: {
        forumQuestions: {
          with: {
            questionOptions: true,
          },
        },
      },
    });

    return res.json({ data: activeCycles });
  };
}
