import { and, desc, eq, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import { votes } from '../db/votes';
import { PluralVoting } from '../modules/plural_voting';
import { insertVotesSchema } from '../types';
import { CycleStatusType } from '../types/cycles';
import { z } from 'zod';

export function getVotes(dbPool: PostgresJsDatabase<typeof db>) {
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

  const out = response.flatMap((cycle) =>
    cycle.forumQuestions.flatMap((question) =>
      question.questionOptions.flatMap((option) => option.votes),
    ),
  );
  return out;
}

export function saveVotes(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const userId = req.session.userId;
    req.body.userId = userId;

    // Query num_of_votes and user_id for a specific option_id
    const queryQuestionOption = await dbPool.query.questionOptions.findFirst({
      where: eq(db.questionOptions.id, req.body.optionId),
    });

    req.body.questionId = queryQuestionOption?.questionId;
    const body = insertVotesSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({ errors: body.error.issues });
    }

    const out = [];

    // Insert votes
    for (const vote of body.data) {
      const newVote = await insertVote(dbPool, vote);

      if (newVote.errors) {
        return res.status(400).json({ errors: newVote.errors });
      }

      out.push(newVote.data);
    }

    const uniqueOptionIds = new Set(body.data.map((vote) => vote.optionId));

    // Update the vote count for each option
    for (const optionId of uniqueOptionIds) {
      // Query num_of_votes and user_id for a specific option_id
      const voteArray = await dbPool.execute<{ userId: string; numOfVotes: number }>(
        sql.raw(`
          SELECT user_id AS "userId", num_of_votes AS "numOfVotes" 
          FROM (
            SELECT user_id, num_of_votes, updated_at,
                   ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as row_num
            FROM votes 
            WHERE option_id = '${optionId}'
          ) AS ranked 
          WHERE row_num = 1
        `),
      );

      // Check if there is at least one value greater than 0 in voteArray
      const hasNonZeroValue = voteArray.some((vote) => vote.numOfVotes > 0);

      // Extract the dictionary of numOfVotes with userId as the key
      const numOfVotesDictionary = voteArray.reduce(
        (acc, vote) => {
          if (!hasNonZeroValue || vote.numOfVotes !== 0) {
            acc[vote.userId] = vote.numOfVotes;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      // Query groupId and array of user ids associated with a given optionId
      const groupArray = await dbPool.execute<{ groupId: string; userIds: string[] }>(
        sql.raw(`
          SELECT group_id AS "groupId", json_agg(user_id) AS "userIds"
          FROM users_to_groups
          WHERE user_id IN (${Object.keys(numOfVotesDictionary)
            .map((id) => `'${id}'`)
            .join(', ')})
          GROUP BY group_id
        `),
      );

      const groupsDictionary = groupArray.reduce(
        (acc, group) => {
          acc[group.groupId] = group.userIds ?? [];
          return acc;
        },
        {} as Record<string, string[]>,
      );

      // Quadratic Voting
      // const [, totalVotes] = quadraticVoting(numOfVotesDictionary);

      // Plural Voting
      const totalVotes = new PluralVoting(
        groupsDictionary,
        numOfVotesDictionary,
      ).pluralScoreCalculation();

      // Update the options table with the new vote count
      await dbPool
        .update(db.questionOptions)
        .set({
          voteCount: totalVotes.toString(),
          updatedAt: new Date(),
        })
        .where(eq(db.questionOptions.id, optionId));
    }

    return res.json({ data: out });
  };
}

export async function insertVote(
  dbPool: PostgresJsDatabase<typeof db>,
  vote: z.infer<typeof insertVotesSchema>[number],
) {
  // check if cycle is open
  const queryQuestion = await dbPool.query.forumQuestions.findFirst({
    where: eq(db.forumQuestions.id, vote?.questionId ?? ''),
    with: {
      cycle: true,
    },
  });

  if ((queryQuestion?.cycle?.status as CycleStatusType) !== 'OPEN') {
    return { errors: [{ message: 'Cycle is not open' }] };
  }

  // save the votes
  const newVote = await dbPool
    .insert(votes)
    .values({
      userId: vote.userId,
      numOfVotes: vote.numOfVotes,
      optionId: vote.optionId,
      questionId: vote.questionId,
    })
    .returning();

  return { data: newVote[0] };
}
