import { eq, inArray } from 'drizzle-orm';
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
      const out = await insertComment(dbPool, body.data, userId);
      return res.json({ data: out });
    } catch (e) {
      console.log('error saving comment ' + e);
      return res.sendStatus(500);
    }
  };
}

/**
 * Inserts a new comment into the database.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database pool connection.
 * @param {z.infer<typeof insertCommentSchema>} data - The comment data to insert.
 * @param {string} userId - The ID of the user making the comment.
 * @returns {Promise<Comment>} - A promise that resolves with the inserted comment.
 * @throws {Error} - Throws an error if the insertion fails.
 */
export async function insertComment(
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
    console.error('Error in insertComment: ', error);
    throw new Error('Failed to insert comment');
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
      // Query userId username pairs
      const users = await dbPool
        .select({
          userId: db.users.id,
          username: db.users.username,
        })
        .from(db.users)
        .where(inArray(db.comments.userId, db.users.id));

      // Query comments
      const comments = await dbPool
        .select()
        .from(db.comments)
        .where(eq(db.comments.questionOptionId, optionId));

      const commentsWithUserNames = comments.map((comment) => {
        const user = users.find((user) => user.userId === comment.userId);
        // If user is found, add user information to comment
        if (user) {
          return {
            ...comment,
            user: {
              userId: user.userId,
              username: user.username,
            },
          };
        } else {
          throw new Error(`User not found for comment with ID ${comment.id}`);
        }
      });

      return res.json({ data: commentsWithUserNames });
    } catch (error) {
      console.error('Error getting comments: ', error);
      return res.sendStatus(500);
    }
  };
}
