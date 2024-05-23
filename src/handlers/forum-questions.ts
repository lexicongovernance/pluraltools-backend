import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import { getQuestionHearts } from '../services/forum-questions';
import { executeResultQueries } from '../services/statistics';
import { calculateFunding } from '../services/funding-mechanism';

export function getQuestionHeartsHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const forumQuestionId = req.params.forumQuestionId;

    if (!forumQuestionId) {
      return res.status(400).json({ error: 'Missing forumQuestionId' });
    }

    const hearts = await getQuestionHearts(dbPool, { forumQuestionId });

    return res.json({ data: hearts });
  };
}

/**
 * Retrieves result statistics for a specific forum question from the database.
 *
 * @param {PostgresJsDatabase<typeof db>} dbPool - The PostgreSQL database pool instance.
 * @returns {Function} - An Express middleware function handling the request to retrieve result statistics.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} - A promise that resolves with the Express response containing the result statistics data.
 */
export function getResultStatisticsHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    try {
      const forumQuestionId = req.params.forumQuestionId;

      // Check if forumQuestionId is provided
      if (!forumQuestionId) {
        return res.status(400).json({ error: 'Missing forumQuestionId parameter' });
      }

      // Execute queries
      const responseData = await executeResultQueries(forumQuestionId, dbPool);

      // Send response
      return res.status(200).json({ data: responseData });
    } catch (error) {
      console.error('Error in getResultStatistics:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

/**
 * Retrieves result statistics for a specific forum question from the database.
 *
 * @param {PostgresJsDatabase<typeof db>} dbPool - The PostgreSQL database pool instance.
 * @returns {Function} - An Express middleware function handling the request to retrieve result statistics.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} - A promise that resolves with the Express response containing the result statistics data.
 */
export function getCalculateFundingHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    try {
      const forumQuestionId = req.params.forumQuestionId;

      // Check if forumQuestionId is provided
      if (!forumQuestionId) {
        return res.status(400).json({ error: 'Missing forumQuestionId parameter' });
      }

      // calculate funding
      const responseData = await calculateFunding(dbPool, forumQuestionId);

      return res.status(200).json({ data: responseData });
    } catch (e) {
      if (e instanceof Error) {
        return res.status(400).json({ errors: [e.message] });
      }
      console.error(e);
      return res.status(500).json({ errors: ['An error occurred while calculating funding'] });
    }
  };
}
