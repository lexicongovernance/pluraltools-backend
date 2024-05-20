import { and, eq, gte, lte } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import { GetCycleById, getCycleVotes } from '../services/cycles';

export function getActiveCyclesHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const activeCycles = await dbPool.query.cycles.findMany({
      where: and(lte(db.cycles.startAt, new Date()), gte(db.cycles.endAt, new Date())),
      with: {
        forumQuestions: {
          with: {
            questionOptions: {
              columns: {
                voteScore: false,
              },
              where: eq(db.questionOptions.accepted, true),
            },
          },
        },
      },
    });

    return res.json({ data: activeCycles });
  };
}

export function getCycleHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const { cycleId } = req.params;

    if (!cycleId) {
      return res.status(400).json({ error: 'Missing cycleId' });
    }

    const out = await GetCycleById(dbPool, cycleId);

    return res.json({ data: out });
  };
}

/**
 * Handler to receive the votes for a specific cycle and user.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
export function getCycleVotesHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const userId = req.session.userId;
    const cycleId = req.params.cycleId;

    if (!cycleId) {
      return res.status(400).json({
        errors: [
          {
            message: 'Expected cycleId in query params',
          },
        ],
      });
    }

    const votesRow = await getCycleVotes(dbPool, userId, cycleId);

    return res.json({ data: votesRow });
  };
}
