import { and, eq, gte, lte } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';

export function getActiveCycles(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const activeCycles = await dbPool.query.cycles.findMany({
      where: and(lte(db.cycles.startAt, new Date()), gte(db.cycles.endAt, new Date())),
      with: {
        forumQuestions: {
          with: {
            questionOptions: {
              where: eq(db.questionOptions.accepted, true),
            },
          },
        },
      },
    });

    return res.json({ data: activeCycles });
  };
}

export function getEventCycles(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: 'Missing eventId' });
    }

    const eventCycles = await dbPool.query.cycles.findMany({
      where: eq(db.cycles.eventId, eventId),
      with: {
        forumQuestions: {
          with: {
            questionOptions: {
              where: eq(db.questionOptions.accepted, true),
            },
          },
        },
      },
    });

    return res.json({ data: eventCycles });
  };
}

export function getCycleById(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const { cycleId } = req.params;

    if (!cycleId) {
      return res.status(400).json({ error: 'Missing cycleId' });
    }

    const cycle = await dbPool.query.cycles.findFirst({
      where: eq(db.cycles.id, cycleId),
      with: {
        forumQuestions: {
          with: {
            questionOptions: {
              with: {
                user: {
                  with: {
                    usersToGroups: {
                      with: {
                        group: true,
                      },
                    },
                  },
                },
              },
              where: eq(db.questionOptions.accepted, true),
            },
          },
        },
      },
    });

    const out = {
      ...cycle,
      forumQuestions: cycle?.forumQuestions.map((question) => {
        return {
          ...question,
          questionOptions: question.questionOptions.map((option) => {
            return {
              id: option.id,
              accepted: option.accepted,
              optionTitle: option.optionTitle,
              optionSubTitle: option.optionSubTitle,
              voteScore: option.voteScore,
              questionId: option.questionId,
              registrationId: option.registrationId,
              user: {
                username: option.user?.username,
                group: option.user?.usersToGroups[0]?.group,
              },
              createdAt: option.createdAt,
              updatedAt: option.updatedAt,
            };
          }),
        };
      }),
    };

    return res.json({ data: out });
  };
}
