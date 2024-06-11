import type { Request, Response } from 'express';
import * as db from '../db';
import { eq } from 'drizzle-orm';
import { deleteCommentLike, saveCommentLike, userCanLike } from '../services/likes';
import { insertCommentSchema } from '../types';
import { deleteComment, saveComment, userCanComment } from '../services/comments';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export function getCommentLikesHandler(dbPool: NodePgDatabase<typeof db>) {
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

export function saveCommentLikeHandler(dbPool: NodePgDatabase<typeof db>) {
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

export function deleteCommentLikeHandler(dbPool: NodePgDatabase<typeof db>) {
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

/**
 * Saves a comment to the database.
 * @param { NodePgDatabase<typeof db>} dbPool - The database pool connection.
 * @returns {Promise<void>} - A promise that resolves once the comment is saved.
 */
export function saveCommentHandler(dbPool: NodePgDatabase<typeof db>) {
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
      const out = await saveComment(dbPool, body.data, userId);
      return res.json({ data: out });
    } catch (e) {
      console.log('error saving comment ' + e);
      return res.sendStatus(500);
    }
  };
}

/**
 * Deletes a comment from the database, along with associated likes if any.
 * @param { NodePgDatabase<typeof db>} dbPool - The database pool connection.
 * @returns {Promise<void>} - A promise that resolves once the comment and associated likes are deleted.
 * @throws {Error} - Throws an error if the deletion fails.
 */
export function deleteCommentHandler(dbPool: NodePgDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const commentId = req.params.commentId;
    const userId = req.session.userId;

    if (!commentId) {
      return res.status(400).json({ errors: ['commentId is required'] });
    }

    try {
      const deletedComment = await deleteComment(dbPool, { commentId, userId });

      if (deletedComment.errors && deletedComment.errors.length > 0) {
        return res.status(400).json({ errors: deletedComment.errors });
      }

      return res.json({ data: deletedComment.data });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ errors: ['Failed to delete comment'] });
    }
  };
}
