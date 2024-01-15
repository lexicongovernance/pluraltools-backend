import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import type { Request, Response } from 'express';
import { sql } from 'drizzle-orm';

export function getAggResultsStatistics(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const forumQuestionId = req.params.forumQuestionId;
    // Fetch hearts for each active question
    const queryResult = await dbPool.execute<{ numProposals: number }>(
      sql.raw(`
            SELECT count("id") AS "numProposals" 
            FROM question_options
            WHERE question_id = '${forumQuestionId}'
          `),
    );

    const numProposals = queryResult[0]?.numProposals;

    // Calculate available hearts
    if (numProposals !== undefined) {
      // const result = availableHearts(countOptions, 4, 5, 0.8, null);
      return res.json({ data: numProposals });
    } else {
      // Return 0 in case there are no options available yet.
      return res.json({ data: 0 });
    }
  };
}
