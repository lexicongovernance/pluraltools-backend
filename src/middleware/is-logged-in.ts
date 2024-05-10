import type { NextFunction, Response, Request } from 'express';
import * as db from '../db';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';

export function isLoggedIn(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response, next: NextFunction) {
    if (req.session?.userId) {
      const rows = await dbPool
        .selectDistinct({
          id: db.users.id,
        })
        .from(db.users)
        .where(eq(db.users.id, req.session.userId));

      if (!rows.length) {
        return res.status(401).send();
      }

      next();
    } else {
      return res.status(401).send();
    }
  };
}
