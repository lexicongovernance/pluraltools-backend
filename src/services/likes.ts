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

async function userCanLike(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  commentId: string,
) {
  // check if user has an accepted registration for the option related to the event
  const res = await dbPool
    .select()
    .from(db.comments)
    .leftJoin(db.questionOptions, eq(db.questionOptions.id, db.comments.questionOptionId))
    .leftJoin(db.forumQuestions, eq(db.forumQuestions.id, db.questionOptions.questionId))
    .leftJoin(db.cycles, eq(db.cycles.id, db.forumQuestions.cycleId))
    .leftJoin(db.events, eq(db.events.id, db.cycles.eventId))
    .leftJoin(db.registrations, eq(db.registrations.eventId, db.events.id))
    .where(and(eq(db.registrations.userId, userId), eq(db.comments.id, commentId)))
    .limit(1);

  if (!res.length) {
    return false;
  }

  if (res[0]?.registrations?.status !== 'ACCEPTED') {
    return false;
  }

  return true;
}
