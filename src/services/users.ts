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

export function getRegistration(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const sessionUserId = req.session.userId;
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

    const registration = await dbPool.query.registrations.findFirst({
      where: eq(db.registrations.userId, userId),
    });

    const usersToGroups = await dbPool.query.usersToGroups.findMany({
      where: eq(db.usersToGroups.userId, userId),
    });

    const usersToRegistrationOptions = await dbPool.query.usersToRegistrationOptions.findMany({
      where: eq(db.usersToRegistrationOptions.userId, userId),
      with: {
        registrationOption: true,
      },
    });

    const out = {
      ...registration,
      groups: usersToGroups,
      registrationOptions: usersToRegistrationOptions,
    };
    return res.json({ data: out });
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

  const out = response
    .map((cycle) =>
      cycle.forumQuestions.map((question) =>
        question.questionOptions.map((option) => option.votes),
      ),
    )
    .flat(3);
  return out;
}
