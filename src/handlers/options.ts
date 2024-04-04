import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import { getOptionComments } from '../services/comments';

export function getOptionHandler(dbPool: PostgresJsDatabase<typeof db>) {
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

/**
 * Retrieves comments related to a specific question option from the database and associates them with corresponding user information.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database pool connection.
 * @returns {Promise<void>} - A promise that resolves with the retrieved comments, each associated with user information if available.
 */
export function getOptionCommentsHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const optionId = req.params.optionId ?? '';

    try {
      const commentsWithUserNames = await getOptionComments(dbPool, { optionId });

      return res.json({ data: commentsWithUserNames });
    } catch (error) {
      console.error('Error getting comments: ', error);
      return res.sendStatus(500);
    }
  };
}
