import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';

export function getOption(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const { optionId } = req.params;

    if (!optionId) {
      return res.status(400).json({ error: 'Missing optionId' });
    }

    const option = await dbPool.query.questionOptions.findFirst({
      where: eq(db.questionOptions.id, optionId),
    });

    return res.json({ data: option });
  };
}
