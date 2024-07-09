import type { Request, Response } from 'express';
import * as schema from '../db/schema';
import { and, eq, gte, lte, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export function getActiveAlerts(dbPool: NodePgDatabase<typeof schema>) {
  return async function (req: Request, res: Response) {
    try {
      const alerts = await dbPool.query.alerts.findMany({
        where: or(
          eq(schema.alerts.active, true),
          and(lte(schema.alerts.startAt, new Date()), gte(schema.alerts.endAt, new Date())),
        ),
      });

      return res.json({ data: alerts });
    } catch (e) {
      console.error(`[ERROR] ${JSON.stringify(e)}`);
      return res.sendStatus(500);
    }
  };
}
