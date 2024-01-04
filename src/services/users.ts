import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import type { Request, Response } from 'express';
import { and, desc, eq } from 'drizzle-orm';

export function getUser(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    try {
      const userId = req.session.userId;
      const user = await dbPool.query.users.findFirst({
        where: eq(db.users.id, userId),
      });

      if (!user) {
        return res.status(401).json({ errors: ['No user found'] });
      }

      return res.json({ data: user });
    } catch (error: any) {
      console.error(`[ERROR] ${JSON.stringify(error)}`);
      return res.sendStatus(500);
    }
  };
}

export function getVotes(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const sessionUserId = req.session.userId;
    const optionId = req.params.optionId;
    const userId = req.params.userId;
    if (userId !== sessionUserId) {
      return res.status(400).json({
        errors: [
          {
            message: 'Not authorized to query this user',
          },
        ],
      });
    }

    if (!optionId) {
      return res.status(400).json({
        errors: [
          {
            message: 'Expected optionId in query params',
          },
        ],
      });
    }

    const votesRow = await getVoteForOptionByUser(dbPool, userId, optionId);

    return res.json({ data: votesRow });
  };
}

export async function getVoteForOptionByUser(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  optionId: string,
) {
  const response = await dbPool.query.votes.findFirst({
    where: and(eq(db.votes.userId, userId), eq(db.votes.optionId, optionId)),
    orderBy: [desc(db.votes.createdAt)],
  });
  const defaultResponse = {
    userId: userId,
    optionId: optionId,
    numOfVotes: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return response ?? defaultResponse;
}
