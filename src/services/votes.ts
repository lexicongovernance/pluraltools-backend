import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import type { Request, Response } from 'express';
import { insertVotesSchema } from '../types';
import { votes } from '../db/votes';
import { and, desc, eq, sql } from 'drizzle-orm';
import { quadraticVoting } from '../modules/quadratic_voting';
import { PluralVoting } from '../modules/plural_voting';

export function saveVote(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const userId = req.session.userId;
    req.body.userId = userId;
    const body = insertVotesSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({ errors: body.error.issues });
    }
    // save the votes
    const newVote = await dbPool
      .insert(votes)
      .values({
        userId: body.data.userId,
        numOfVotes: body.data.numOfVotes,
        optionId: body.data.optionId,
      })
      .returning();

    // Query num_of_votes and user_id for a specific option_id
    const voteArray = await dbPool.execute<{ userId: string; numOfVotes: number }>(
      sql.raw(`
          SELECT user_id AS "userId", num_of_votes AS "numOfVotes" 
          FROM (
            SELECT user_id, num_of_votes, updated_at,
                   ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as row_num
            FROM votes 
            WHERE option_id = '${body.data.optionId}'
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
      .where(eq(db.questionOptions.id, body.data.optionId));

    // Return new vote object and list of numOfVotes for the optionId
    return res.json({ data: { ...newVote[0], totalVotes } });
  };
}
