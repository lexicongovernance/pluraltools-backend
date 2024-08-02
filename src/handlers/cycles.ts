import { and, eq, gte, lte } from 'drizzle-orm';
import type { Request, Response } from 'express';
import * as schema from '../db/schema';
import { GetCycleById, getCycleVotes } from '../services/cycles';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export function getActiveCyclesHandler(dbPool: NodePgDatabase<typeof schema>) {
  return async function (req: Request, res: Response) {
    const activeCycles = await dbPool.query.cycles.findMany({
      where: and(lte(schema.cycles.startAt, new Date()), gte(schema.cycles.endAt, new Date())),
      with: {
        questions: {
          with: {
            options: {
              columns: {
                voteScore: false,
              },
              where: eq(schema.options.show, true),
            },
          },
        },
      },
    });

    return res.json({ data: activeCycles });
  };
}

export function getCycleHandler(dbPool: NodePgDatabase<typeof schema>) {
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
 */
export function getCycleVotesHandler(dbPool: NodePgDatabase<typeof schema>) {
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
