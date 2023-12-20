import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { and, gte, lte } from 'drizzle-orm';
import type { Request, Response } from 'express';

export function getActiveCycles(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const activeCycles = dbPool.query.cycles.findMany({
      where: and(lte(db.cycles.startAt, new Date()), gte(db.cycles.endAt, new Date())),
      with: {
        questions: true,
        options: true,
      },
    });

    return res.json({ data: activeCycles });
  };
}
