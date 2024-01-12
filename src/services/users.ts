import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import type { Request, Response } from 'express';
import { and, desc, eq } from 'drizzle-orm';
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
    const cycleId = req.params.cycleId;
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

    if (!cycleId) {
      return res.status(400).json({
        errors: [
          {
            message: 'Expected cycleId in query params',
          },
        ],
      });
    }

    const votesRow = await getVotesForCycleByUser(dbPool, userId, cycleId);

    return res.json({ data: votesRow });
  };
}

export function updateUser(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    // parse input
    const queryUserId = req.params.userId;
    const userId = req.session.userId;

    if (queryUserId !== userId) {
      return res.status(400).json({
        errors: [
          {
            message: 'Not authorized to update this user',
          },
        ],
      });
    }

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
        updatedAt: new Date(),
      })
      .where(eq(db.users.id, userId))
      .returning();

    const updatedGroups = await overwriteUsersToGroups(dbPool, userId, body.data.groupIds);

    return res.json({ data: { user, updatedGroups } });
  };
}

export async function getVotesForCycleByUser(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  cycleId: string,
) {
  const response = await dbPool.query.cycles.findMany({
    with: {
      forumQuestions: {
        with: {
          questionOptions: {
            with: {
              votes: {
                where: and(eq(db.votes.userId, userId)),
                limit: 1,
                orderBy: [desc(db.votes.createdAt)],
              },
            },
          },
        },
      },
    },
    where: eq(db.cycles.id, cycleId),
  });

  const out = response.flatMap((cycle) =>
    cycle.forumQuestions.flatMap((question) =>
      question.questionOptions.flatMap((option) => option.votes),
    ),
  );
  return out;
}
