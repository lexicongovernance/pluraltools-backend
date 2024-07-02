import { eq, sql } from 'drizzle-orm';
import * as db from '../db';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export async function GetCycleById(dbPool: NodePgDatabase<typeof db>, cycleId: string) {
  const cycle = await dbPool.query.cycles.findFirst({
    where: eq(db.cycles.id, cycleId),
    with: {
      questions: {
        with: {
          options: {
            with: {
              user: {
                with: {
                  usersToGroups: {
                    with: {
                      group: {
                        columns: {
                          secret: false,
                        },
                        with: {
                          groupCategory: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            where: eq(db.options.accepted, true),
          },
        },
      },
    },
  });

  const out = {
    ...cycle,
    forumQuestions: cycle?.questions.map((question) => {
      return {
        ...question,
        questionOptions: question.options.map((option) => {
          return {
            id: option.id,
            accepted: option.accepted,
            optionTitle: option.optionTitle,
            optionSubTitle: option.optionSubTitle,
            questionId: option.questionId,
            voteScore: question.showScore ? option.voteScore : undefined,
            registrationId: option.registrationId,
            fundingRequest: option.fundingRequest,
            user: {
              username: option.user?.username,
              firstName: option.user?.firstName,
              lastName: option.user?.lastName,
              groups: option.user?.usersToGroups.map((userToGroup) => userToGroup.group),
            },
            createdAt: option.createdAt,
            updatedAt: option.updatedAt,
          };
        }),
      };
    }),
  };

  return out;
}

/**
 * Retrieves the votes for a specific cycle and user.
 * @param { NodePgDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string} userId - The ID of the user.
 * @param {string} cycleId - The ID of the cycle.
 */
export async function getCycleVotes(
  dbPool: NodePgDatabase<typeof db>,
  userId: string,
  cycleId: string,
) {
  const response = await dbPool.query.cycles.findMany({
    with: {
      questions: {
        with: {
          options: {
            columns: {
              voteScore: false,
            },
            with: {
              votes: {
                where: ({ optionId }) =>
                  sql`${db.votes.createdAt} = (
                    SELECT MAX(created_at) FROM (
                        SELECT created_at, user_id FROM votes 
                        WHERE user_id = ${userId} AND option_id = ${optionId}
                    ) as ranked
                  )`,
              },
            },
          },
        },
      },
    },
    where: eq(db.cycles.id, cycleId),
  });

  const out = response.flatMap((cycle) =>
    cycle.questions.flatMap((question) => question.options.flatMap((option) => option.votes)),
  );

  return out;
}
