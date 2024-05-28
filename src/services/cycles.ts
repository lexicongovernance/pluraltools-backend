import { eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';

export async function GetCycleById(dbPool: PostgresJsDatabase<typeof db>, cycleId: string) {
  const cycle = await dbPool.query.cycles.findFirst({
    where: eq(db.cycles.id, cycleId),
    with: {
      forumQuestions: {
        with: {
          questionsToGroupCategories: {
            with: {
              groupCategory: true,
            },
          },
          questionOptions: {
            columns: {
              voteScore: false,
            },
            with: {
              user: {
                with: {
                  usersToGroups: {
                    with: {
                      group: {
                        columns: {
                          secret: false,
                        },
                      },
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

  const relevantCategories = cycle?.forumQuestions.flatMap((question) =>
    question.questionsToGroupCategories
      // TODO: This is a workaround to only show affiliation
      .filter((q) => !q.groupCategory?.userCanLeave)
      .map((q) => q.groupCategoryId),
  );

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
            questionId: option.questionId,
            registrationId: option.registrationId,
            fundingRequest: option.fundingRequest,
            user: {
              username: option.user?.username,
              firstName: option.user?.firstName,
              lastName: option.user?.lastName,
              // return a group if the user is in a group that is relevant to the cycle
              group: option.user?.usersToGroups.find((userToGroup) =>
                relevantCategories?.includes(userToGroup.groupCategoryId),
              )?.group,
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
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string} userId - The ID of the user.
 * @param {string} cycleId - The ID of the cycle.
 */
export async function getCycleVotes(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  cycleId: string,
) {
  const response = await dbPool.query.cycles.findMany({
    with: {
      forumQuestions: {
        with: {
          questionOptions: {
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
    cycle.forumQuestions.flatMap((question) =>
      question.questionOptions.flatMap((option) => option.votes),
    ),
  );

  return out;
}
