import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import type { Request, Response } from 'express';
import { sql } from 'drizzle-orm';

export function getAggResultsStatistics(dbPool: PostgresJsDatabase<typeof db>) {
  // Returns the aggregate statistics for the results page
  return async function (req: Request, res: Response) {
    const forumQuestionId = req.params.forumQuestionId;
    // Get total number of proposals
    const queryResultNumProposals = await dbPool.execute<{ numProposals: number }>(
      sql.raw(`
            SELECT count("id") AS "numProposals" 
            FROM question_options
            WHERE question_id = '${forumQuestionId}'
          `),
    );

    const queryResultAllocatedHearts = await dbPool.execute<{ sumNumOfHearts: number }>(
      sql.raw(`
            WITH votes_question_id AS (
                SELECT * 
                FROM votes 
                WHERE option_id IN (
                    SELECT "id" AS "optionId"
                    FROM question_options
                    WHERE question_id = '${forumQuestionId}'
                )
            )
            
            SELECT sum(num_of_votes) AS "sumNumOfHearts"
            FROM (
                SELECT user_id, num_of_votes, updated_at,
                    ROW_NUMBER() OVER (PARTITION BY user_id, option_id ORDER BY updated_at DESC) as row_num
                FROM votes_question_id 
                ) AS ranked 
            WHERE row_num = 1
            `),
    );

    const numProposals = queryResultNumProposals[0]?.numProposals;
    const sumNumOfHearts = queryResultAllocatedHearts[0]?.sumNumOfHearts;

    // Check if values are undefined and provide default values if necessary
    const responseData = {
      numProposals: numProposals !== undefined ? numProposals : 0,
      sumNumOfHearts: sumNumOfHearts !== undefined ? sumNumOfHearts : 0,
    };

    return res.json({ data: responseData });
  };
}
