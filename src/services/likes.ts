import type { Request, Response } from 'express';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { and, eq } from 'drizzle-orm';

export function getLike(dbPool: PostgresJsDatabase<typeof db>) {
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

    return res.json({ data: like });
  };
}

export function saveLike(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const commentId = req.params.commentId;
    const userId = req.session.userId;

    if (!commentId) {
      return res.status(400).json({ errors: ['commentId is required'] });
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
