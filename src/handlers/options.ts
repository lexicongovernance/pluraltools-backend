import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import { getOptionUsers, getOptionComments } from '../services/comments';

export function getOptionHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const { optionId } = req.params;

    if (!optionId) {
      return res.status(400).json({ error: 'Missing optionId' });
    }

    const option = await dbPool
      .select({
        id: db.questionOptions.id,
        userId: db.questionOptions.userId,
        registrationId: db.questionOptions.registrationId,
        questionId: db.questionOptions.questionId,
        optionTitle: db.questionOptions.optionTitle,
        optionSubTitle: db.questionOptions.optionSubTitle,
        accepted: db.questionOptions.accepted,
        createdAt: db.questionOptions.createdAt,
        updatedAt: db.questionOptions.updatedAt,
      })
      .from(db.questionOptions)
      .where(eq(db.questionOptions.id, optionId));

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

/**
 * Retrieves author and co-author data for a given question option created as a secret group.
 *
 * @param {PostgresJsDatabase<typeof db>} dbPool - The PostgreSQL database pool instance.
 * @returns {Function} - An Express middleware function handling the request to retrieve result statistics.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} - A promise that resolves with the Express response containing the author data.
 */
export function getOptionUsersHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    try {
      const optionId = req.params.optionId;

      // Check if optionId is provided
      if (!optionId) {
        return res.status(400).json({ error: 'Missing optionId parameter' });
      }

      // Execute queries
      const responseData = await getOptionUsers(optionId, dbPool);

      // Send response
      return res.status(200).json({ data: responseData });
    } catch (error) {
      console.error('Error in getOptionAuthors:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
