import { eq, getTableColumns } from 'drizzle-orm';
import type { Request, Response } from 'express';
import * as db from '../db';
import { getOptionUsers, getOptionComments } from '../services/comments';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export function getOptionHandler(dbPool: NodePgDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const { optionId } = req.params;

    if (!optionId) {
      return res.status(400).json({ error: 'Missing optionId' });
    }

    const { voteScore, ...rest } = getTableColumns(db.options);

    const rows = await dbPool
      .select({
        ...rest,
      })
      .from(db.options)
      .where(eq(db.options.id, optionId));

    if (!rows.length) {
      return res.status(404).json({ error: 'Option not found' });
    }

    return res.json({ data: rows[0] });
  };
}

/**
 * Retrieves comments related to a specific question option from the database and associates them with corresponding user information.
 * @param { NodePgDatabase<typeof db>} dbPool - The database pool connection.
 * @returns {Promise<void>} - A promise that resolves with the retrieved comments, each associated with user information if available.
 */
export function getOptionCommentsHandler(dbPool: NodePgDatabase<typeof db>) {
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
 * @param { NodePgDatabase<typeof db>} dbPool - The PostgreSQL database pool instance.
 * @returns {Function} - An Express middleware function handling the request to retrieve result statistics.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} - A promise that resolves with the Express response containing the author data.
 */
export function getOptionUsersHandler(dbPool: NodePgDatabase<typeof db>) {
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
      console.error('Error in getOptionUsers:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
