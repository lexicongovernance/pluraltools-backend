import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import type { Request, Response } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { getVoteForOptionByUser } from './votes';
import { insertUserSchema } from '../types/users';
import { overwriteUsersToGroups } from './usersToGroups';

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

export const updateUser = (dbPool: PostgresJsDatabase<typeof db>) => async () => {
  return async function (req: Request, res: Response) {
    // parse input
    const userId = req.session.userId;
    const body = insertUserSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({ errors: body.error.errors });
    }

    // update user
    const user = await dbPool
      .update(db.users)
      .set({
        email: body.data.email,
        username: body.data.username,
      })
      .where(eq(db.users.id, userId))
      .returning();

    const updatedGroups = overwriteUsersToGroups(dbPool, userId, body.data.groupIds);

    return res.json({ data: { user, updatedGroups } });
  };
};
