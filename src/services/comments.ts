import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import { insertCommentSchema } from '../types';
import { z } from 'zod';
import * as db from '../db';

/**
 * Saves a comment to the database.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database pool connection.
 * @returns {Promise<void>} - A promise that resolves once the comment is saved.
 */
export function saveComment(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const userId = req.session.userId;
    const body = insertCommentSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({ errors: body.error.issues });
    }

    try {
      const out = await upsertComment(dbPool, body.data, userId);
      return res.json({ data: out });
    } catch (e) {
      console.log('error saving comment ' + e);
      return res.sendStatus(500);
    }
  };
}

/**
 * Upserts a comment into the database.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database pool connection.
 * @param {z.infer<typeof insertCommentSchema>} data - The comment data to upsert.
 * @param {string} userId - The ID of the user making the comment.
 * @returns {Promise<Comment>} - A promise that resolves with the upserted comment.
 * @throws {Error} - Throws an error if the upsert fails.
 */
export async function upsertComment(
  dbPool: PostgresJsDatabase<typeof db>,
  data: z.infer<typeof insertCommentSchema>,
  userId: string,
) {
  try {
    const newComment = await dbPool
      .insert(db.comments)
      .values({
        userId: userId,
        questionOptionId: data.questionOptionId,
        value: data.value,
      })
      .returning();
    return newComment[0];
  } catch (error) {
    console.error('Error in upsertComment: ', error);
    throw new Error('Failed to upsert comment');
  }
}

/**
 * Retrieves comments related to a specific question option from the database.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database pool connection.
 * @returns {Promise<void>} - A promise that resolves with the retrieved comments.
 */
export function getCommentsForOption(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const optionId = req.params.optionId ?? '';

    try {
      // Query the database for comments related to the specified questionOptionId
      const comments = await dbPool.query.comments.findMany({
        where: eq(db.comments.questionOptionId, optionId),
      });

      return res.json({ data: comments });
    } catch (error) {
      console.error('Error getting comments: ', error);
      return res.sendStatus(500);
    }
  };
}
