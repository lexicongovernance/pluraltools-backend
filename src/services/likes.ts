import type { Request, Response } from 'express';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { and, eq } from 'drizzle-orm';

export function getLikes(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const commentId = req.params.commentId;

    if (!commentId) {
      return res.status(400).json({ errors: ['commentId is required'] });
    }

    const likes = await dbPool.query.likes.findMany({
      where: and(eq(db.comments.id, commentId)),
    });

    return res.json({ data: likes });
  };
}

export function saveLike(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const commentId = req.params.commentId;
    const userId = req.session.userId;

    if (!commentId) {
      return res.status(400).json({ errors: ['commentId is required'] });
    }

    const canLike = await userCanLike(dbPool, userId, commentId);

    if (!canLike) {
      return res.status(403).json({ errors: [{ message: 'User cannot like this comment' }] });
    }

    const like = await dbPool.query.likes.findFirst({
      where: and(eq(db.comments.id, commentId), eq(db.comments.userId, userId)),
    });

    if (like) {
      return res.status(400).json({ errors: ['like already exists'] });
    }

    try {
      const newLike = await dbPool
        .insert(db.likes)
        .values({
          commentId,
          userId,
        })
        .returning();

      return res.json({ data: newLike[0] });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ errors: ['Failed to save like'] });
    }
  };
}

export function deleteLike(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const commentId = req.params.commentId;
    const userId = req.session.userId;

    if (!commentId) {
      return res.status(400).json({ errors: ['commentId is required'] });
    }

    const like = await dbPool.query.likes.findFirst({
      where: and(eq(db.comments.id, commentId), eq(db.comments.userId, userId)),
    });

    if (!like) {
      return res.status(404).json({ errors: ['like not found'] });
    }

    try {
      const deletedLike = await dbPool.delete(db.likes).where(eq(db.likes.id, like.id)).returning();

      return res.json({ data: deletedLike });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ errors: ['Failed to delete like'] });
    }
  };
}

/**
 * Checks whether a user can like a comment based on their registration status.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The PostgreSQL database pool.
 * @param {string} userId - The ID of the user attempting to like the comment.
 * @param {string} commentId - The ID of the comment to be liked.
 * @returns {Promise<boolean>} A promise that resolves to true if the user can like the comment, false otherwise.
 */
async function userCanLike(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  commentId: string,
) {
  if (!commentId) {
    return false;
  }

  // check if user has an accepted registration
  const res = await dbPool
    .selectDistinct({
      user: db.registrations.userId,
    })
    .from(db.registrations)
    .where(and(eq(db.registrations.userId, userId), eq(db.registrations.status, 'ACCEPTED')));

  if (!res.length) {
    return false;
  }

  return true;
}
