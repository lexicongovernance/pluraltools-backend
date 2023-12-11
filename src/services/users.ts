import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as db from '../db';
import type { Request, Response } from 'express';
import { users } from '../db';
import { eq } from 'drizzle-orm';

export function getUser(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    try {
      const userId = req.session.userId;
      const user = await dbPool
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (user.length === 0) {
        return res.status(401).json({ errors: ['No user found'] });
      }

      return res.json(user);
    } catch (error: any) {
      console.error(`[ERROR] ${JSON.stringify(error)}`);
      return res.sendStatus(500);
    }
  };
}
