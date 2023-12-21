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

export function getVoteForOptionByUser(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  optionId: string,
) {
  return dbPool.query.votes.findFirst({
    where: and(eq(db.votes.userId, userId), eq(db.votes.optionId, optionId)),
    orderBy: [desc(db.votes.createdAt)],
  });
}
