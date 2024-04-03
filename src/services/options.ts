import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';

export function getUserOptions(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const query = await dbPool
      .select()
      .from(db.questionOptions)
      .leftJoin(db.registrations, eq(db.registrations.id, db.questionOptions.registrationId))
      .where(eq(db.registrations.userId, userId));

    const options = query.map((q) => q.question_options);

    return res.json({ data: options });
  };
}
