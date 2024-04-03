import type { Request, Response } from 'express';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq } from 'drizzle-orm';
import { deleteCommentLike, saveCommentLike, userCanLike } from '../services/likes';

export function getCommentLikesHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const commentId = req.params.commentId;

    if (!commentId) {
      return res.status(400).json({ errors: ['commentId is required'] });
    }

    const likes = await dbPool.query.likes.findMany({
      where: eq(db.likes.commentId, commentId),
    });

    return res.json({ data: likes });
  };
}

export function saveCommentLikeHandler(dbPool: PostgresJsDatabase<typeof db>) {
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

    const like = await saveCommentLike(dbPool, { commentId, userId });

    if (like.errors && like.errors.length > 0) {
      return res.status(400).json({ errors: like.errors });
    }

    return res.json({ data: like.data });
  };
}

export function deleteCommentLikeHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const commentId = req.params.commentId;
    const userId = req.session.userId;

    if (!commentId) {
      return res.status(400).json({ errors: ['commentId is required'] });
    }

    try {
      const deletedLike = await deleteCommentLike(dbPool, { commentId, userId });

      if (deletedLike.errors && deletedLike.errors.length > 0) {
        return res.status(400).json({ errors: deletedLike.errors });
      }

      return res.json({ data: deletedLike.data });
    } catch (e) {
      console.error(`[ERROR] ${e}`);
      return res.status(500).json({ errors: ['Failed to delete like'] });
    }
  };
}
