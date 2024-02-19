import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import { insertCommentSchema } from '../types';
import { z } from 'zod';
import * as db from '../db';

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

export function getCommentsForOption(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const questionOptionId = req.params.questionOptionId ?? '';

    try {
      // Query the database for comments related to the specified questionOptionId
      const comments = await dbPool.query.comments.findMany({
        where: eq(db.comments.questionOptionId, questionOptionId),
      });

      return res.json({ data: comments });
    } catch (error) {
      console.error('Error getting comments: ', error);
      return res.sendStatus(500);
    }
  };
}
