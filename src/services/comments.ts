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
async function userCanComment(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  optionId: string | undefined | null,
) {
  if (!optionId) {
    return false;
  }

  // check if user has an accepted registration for the option related to the event
  const res = await dbPool
    .select()
    .from(db.questionOptions)
    .leftJoin(db.forumQuestions, eq(db.forumQuestions.id, db.questionOptions.questionId))
    .leftJoin(db.cycles, eq(db.cycles.id, db.forumQuestions.cycleId))
    .leftJoin(db.events, eq(db.events.id, db.cycles.eventId))
    .leftJoin(db.registrations, eq(db.registrations.eventId, db.events.id))
    .where(and(eq(db.registrations.userId, userId), eq(db.questionOptions.id, optionId)))
    .limit(1);

  if (!res.length) {
    return false;
  }

  if (res[0]?.registrations?.status !== 'ACCEPTED') {
    return false;
  }

  return true;
}
