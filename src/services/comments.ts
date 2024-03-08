import { eq, and } from 'drizzle-orm';
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

    const canComment = await userCanComment(dbPool, userId, body.data.questionOptionId);

    if (!canComment) {
      return res.status(403).json({ errors: [{ message: 'User cannot comment on this option' }] });
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
 * Deletes a comment from the database, along with associated likes if any.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database pool connection.
 * @returns {Promise<void>} - A promise that resolves once the comment and associated likes are deleted.
 * @throws {Error} - Throws an error if the deletion fails.
 */
export function deleteComment(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const commentId = req.params.commentId;
    const userId = req.session.userId;

    if (!commentId) {
      return res.status(400).json({ errors: ['commentId is required'] });
    }

    try {
      // Only the author of the comment has the authorization to delete the comment
      const comment = await dbPool.query.comments.findFirst({
        where: and(eq(db.comments.id, commentId), eq(db.comments.userId, userId)),
      });

      if (!comment) {
        return res.status(404).json({ errors: ['Unauthorized to delete comment'] });
      }

      // Delete all likes associated with the deleted comment
      await dbPool.delete(db.likes).where(eq(db.likes.commentId, commentId));

      // Delete the comment
      const deletedComment = await dbPool
        .delete(db.comments)
        .where(eq(db.comments.id, commentId))
        .returning();

      return res.json({ data: deletedComment });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ errors: ['Failed to delete comment'] });
    }
  };
}

/**
 * Retrieves comments related to a specific question option from the database and associates them with corresponding user information.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database pool connection.
 * @returns {Promise<void>} - A promise that resolves with the retrieved comments, each associated with user information if available.
 */
export function getCommentsForOption(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const optionId = req.params.optionId ?? '';

    try {
      // Query comments
      const rows = await dbPool
        .select()
        .from(db.comments)
        .leftJoin(db.users, eq(db.comments.userId, db.users.id))
        .where(eq(db.comments.questionOptionId, optionId));

      const commentsWithUserNames = rows.map((row) => {
        return {
          id: row.comments.id,
          userId: row.comments.userId,
          questionOptionId: row.comments.questionOptionId,
          value: row.comments.value,
          createdAt: row.comments.createdAt,
          user: {
            id: row.users?.id,
            username: row.users?.username,
          },
        };
      });

      return res.json({ data: commentsWithUserNames });
    } catch (error) {
      console.error('Error getting comments: ', error);
      return res.sendStatus(500);
    }
  };
}

/**
 * Checks whether a user can comment based on their registration status.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The PostgreSQL database pool.
 * @param {string} userId - The ID of the user attempting to comment.
 * @param {string | undefined | null} optionId - The ID of the option for which the user is attempting to comment.
 * @returns {Promise<boolean>} A promise that resolves to true if the user can comment, false otherwise.
 */
async function userCanComment(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  optionId: string | undefined | null,
) {
  if (!optionId) {
    return false;
  }

  // check if user has an approved registration
  const res = await dbPool
    .selectDistinct({
      user: db.registrations.userId,
    })
    .from(db.registrations)
    .where(and(eq(db.registrations.userId, userId), eq(db.registrations.status, 'APPROVED')));

  if (!res.length) {
    return false;
  }

  return true;
}
