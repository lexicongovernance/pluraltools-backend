import type { NextFunction, Response, Request } from 'express';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export function isLoggedIn(dbPool: NodePgDatabase<typeof schema>) {
  return async function (req: Request, res: Response, next: NextFunction) {
    if (req.session?.userId) {
      const rows = await dbPool
        .selectDistinct({
          id: schema.users.id,
        })
        .from(schema.users)
        .where(eq(schema.users.id, req.session.userId));

      if (!rows.length) {
        return res.status(401).send();
      }

      next();
    } else {
      return res.status(401).send();
    }
  };
}
