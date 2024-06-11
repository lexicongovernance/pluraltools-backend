import type { Request, Response } from 'express';
import * as db from '../db';
import { and, eq, gte, lte, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export function getActiveAlerts(dbPool: NodePgDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    try {
      const alerts = await dbPool.query.alerts.findMany({
        where: or(
          eq(db.alerts.active, true),
          and(lte(db.alerts.startAt, new Date()), gte(db.alerts.endAt, new Date())),
        ),
      });

      return res.json({ data: alerts });
    } catch (e) {
      console.error(`[ERROR] ${JSON.stringify(e)}`);
      return res.sendStatus(500);
    }
  };
}
