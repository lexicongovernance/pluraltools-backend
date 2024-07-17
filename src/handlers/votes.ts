import type { Request, Response } from 'express';
import { z } from 'zod';
import * as db from '../db';
import { validateAndSaveVotes, updateOptionScore } from '../services/votes';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { logger } from '../utils/logger';

/**
 * Handler function that saves votes submitted by a user.
 * @param { NodePgDatabase<typeof db>} dbPool - The database connection pool.
 * @param {Request} req - The Express request object containing the user's submitted votes.
 * @param {Response} res - The Express response object to send the result.
 */
export function saveVotesHandler(dbPool: NodePgDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const userId = req.session.userId;

    const reqBody = z
      .array(
        z.object({
          optionId: z.string(),
          numOfVotes: z.number().min(0),
        }),
      )
      .safeParse(req.body);

    if (!reqBody.success) {
      return res.status(400).json({ errors: reqBody.error.errors });
    }

    // Insert votes
    try {
      const voteResults = await validateAndSaveVotes(dbPool, reqBody.data, userId);

      if (voteResults.errors && voteResults.errors.length > 0) {
        return res.status(400).json({ errors: voteResults.errors });
      }

      const optionScores = await updateOptionScore(dbPool, reqBody.data, voteResults.questionIds);

      if (optionScores.errors && optionScores.errors.length > 0) {
        return res.status(400).json({ errors: optionScores.errors });
      }

      return res.json({ data: optionScores.data });
    } catch (e) {
      logger.error(`error saving votes: ${e}`);
      return res.status(500).json({ errors: e });
    }
  };
}
