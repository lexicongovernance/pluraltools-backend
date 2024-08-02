import type { Request, Response } from 'express';
import * as schema from '../db/schema';
import { and, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { logger } from '../utils/logger';

export function getActiveNavLinks(dbPool: NodePgDatabase<typeof schema>) {
  return async function (req: Request, res: Response) {
    try {
      const navLinks = await dbPool.query.navLinks.findMany({
        where: and(
          or(
            eq(schema.navLinks.active, true),
            and(lte(schema.navLinks.startAt, new Date()), gte(schema.navLinks.endAt, new Date())),
          ),
          isNull(schema.navLinks.eventId),
        ),
      });

      return res.json({ data: navLinks });
    } catch (e) {
      logger.error(`[ERROR] ${JSON.stringify(e)}`);
      return res.sendStatus(500);
    }
  };
}
