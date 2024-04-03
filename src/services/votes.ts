import { and, eq, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { votes } from '../db/votes';
import { PluralVoting } from '../modules/pluralVoting';
import { insertVotesSchema } from '../types';
import { CycleStatusType } from '../types/cycles';
import { z } from 'zod';
import { quadraticVoting } from '../modules/quadraticVoting';

/**
 * Handler function that saves votes submitted by a user.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @param {Request} req - The Express request object containing the user's submitted votes.
 * @param {Response} res - The Express response object to send the result.
 */
export async function saveVotes(
  dbPool: PostgresJsDatabase<typeof db>,
  data: { optionId: string; numOfVotes: number }[],
  userId: string,
): Promise<{ data: db.Vote[]; errors: string[] }> {
  const out: db.Vote[] = [];
  const errors: string[] = [];

  for (const vote of data) {
    const { data, error } = await validateAndSaveVote(dbPool, vote, userId);
    if (data) {
      out.push(data);
    }
    if (error) {
      errors.push(error);
    }
  }

  const uniqueOptionIds = new Set(out.map((vote) => vote.optionId));

  // Update the vote count for each option
  for (const optionId of uniqueOptionIds) {
    await updateVoteScore(dbPool, optionId);
  }

  return { data: out, errors };
}

/**
Queries lastest vote data by users for a specified option ID.
@param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
@param {string} optionId - The ID of the option for which to query vote data.
*/
export async function queryVoteData(dbPool: PostgresJsDatabase<typeof db>, optionId: string) {
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
  return voteArray;
}

/**
Creates a dictionary of votes out of and array of votes.
@param {Array<{ userId: string; numOfVotes: number }>} voteArray - An array of vote data containing the user ID and number of votes.
*/
export function numOfVotesDictionary(voteArray: Array<{ userId: string; numOfVotes: number }>) {
  const hasNonZeroValue = voteArray.some((vote) => vote.numOfVotes > 0);
  const numOfVotesDictionary = voteArray.reduce(
    (acc, vote) => {
      if (!hasNonZeroValue || vote.numOfVotes !== 0) {
        acc[vote.userId] = vote.numOfVotes;
      }
      return acc;
    },
    {} as Record<string, number>,
  );
  return numOfVotesDictionary;
}

/**
 * Queries group data and creates group dictionary based on user IDs and option ID.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 */
export async function groupsDictionary(
  dbPool: PostgresJsDatabase<typeof db>,
  numOfVotesDictionary: Record<string, number>,
) {
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

  return groupsDictionary;
}

/**
Calculates the plural score based on the provided groups dictionary and number of votes dictionary.
@param {Record<string, string[]>} groupsDictionary - A dictionary where keys are group IDs and values are arrays of user IDs belonging to each group.
@param {Record<string, number>} numOfVotesDictionary - A dictionary where keys are user IDs and values are the corresponding votes.
*/
export function calculatePluralScore(
  groupsDictionary: Record<string, string[]>,
  numOfVotesDictionary: Record<string, number>,
) {
  const score = new PluralVoting(groupsDictionary, numOfVotesDictionary).pluralScoreCalculation();
  return score;
}

/**
Calculates the quadratic score based on the provided number of votes dictionary.
@param {Record<string, number>} numOfVotesDictionary - A dictionary where keys are user IDs and values are the corresponding multiplied votes.
*/
export function calculateQuadraticScore(numOfVotesDictionary: Record<string, number>) {
  const [, score] = quadraticVoting(numOfVotesDictionary);
  return score;
}

/**
Updates the vote score for a specific option in the database.
@param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
@param {string} optionId - The ID of the option for which to update the vote score.
@param {number} score - The new vote score to be set.
*/
export async function updateVoteScoreInDatabase(
  dbPool: PostgresJsDatabase<typeof db>,
  optionId: string,
  score: number,
) {
  // Update vote score in the database
  await dbPool
    .update(db.questionOptions)
    .set({
      voteScore: score.toString(),
      updatedAt: new Date(),
    })
    .where(eq(db.questionOptions.id, optionId));
}

/**
 * Updates the vote score for a specific option in the database.
 *
 * This function queries vote and multiplier data from the database,
 * combines them, calculates the score using plural voting, updates
 * the vote score in the database, and returns the calculated score.
 *
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string} optionId - The ID of the option for which to update the vote score.
 */
export async function updateVoteScore(
  dbPool: PostgresJsDatabase<typeof db>,
  optionId: string,
): Promise<number> {
  // Query vote data and multiplier from the database
  const voteArray = await queryVoteData(dbPool, optionId);

  // Transform data
  const votesDictionary = await numOfVotesDictionary(voteArray);

  // Query group data
  const groupArray = await groupsDictionary(dbPool, votesDictionary);

  // Perform plural voting calculation
  const score = await calculatePluralScore(groupArray, votesDictionary);

  // Perform quadratic score calculation
  // const score = await calculateQuadraticScore(votesDictionary);

  // Update vote score in the database
  await updateVoteScoreInDatabase(dbPool, optionId, score);

  return score;
}

/**
 * Validates and saves a vote for a user in the database.
 *
 * This function validates the provided vote object, checks if the option exists,
 * inserts the vote into the database, and returns the saved vote data or an error message.
 *
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @param {{ optionId: string; numOfVotes: number }} vote - The vote object containing option ID and number of votes.
 * @param {string} userId - The ID of the user who is voting.
 */
async function validateAndSaveVote(
  dbPool: PostgresJsDatabase<typeof db>,
  vote: { optionId: string; numOfVotes: number },
  userId: string,
): Promise<{ data: db.Vote | null | undefined; error: string | null | undefined }> {
  if (!vote.optionId) {
    return { data: null, error: 'optionId is required' };
  }

  const queryQuestionOption = await dbPool.query.questionOptions.findFirst({
    where: eq(db.questionOptions.id, vote.optionId),
  });

  if (!queryQuestionOption) {
    return { data: null, error: 'Option not found' };
  }

  const insertVoteBody: z.infer<typeof insertVotesSchema> = {
    optionId: vote.optionId,
    numOfVotes: vote.numOfVotes,
    userId: userId,
    questionId: queryQuestionOption.questionId,
  };

  const body = insertVotesSchema.safeParse(insertVoteBody);

  if (!body.success) {
    return { data: null, error: body.error.errors[0]?.message };
  }

  // check if user can vote
  const canVote = await userCanVote(dbPool, userId, vote.optionId);
  if (!canVote) {
    return { data: null, error: 'User cannot vote' };
  }

  const newVote = await saveVote(dbPool, insertVoteBody);

  if (newVote.errors) {
    return { data: null, error: newVote.errors[0]?.message };
  }

  if (!newVote.data) {
    return { data: null, error: 'Failed to insert vote' };
  }

  return { data: newVote.data, error: null };
}

/**
 * Saves a vote in the database.
 *
 * This function checks if the cycle for the given question is open,
 * then inserts the provided vote data into the database and returns the saved vote data.
 *
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @param {z.infer<typeof insertVotesSchema>} vote - The vote data to be saved.
 */
export async function saveVote(
  dbPool: PostgresJsDatabase<typeof db>,
  vote: z.infer<typeof insertVotesSchema>,
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

/**
 * Checks whether a user can vote on an option based on their registration status.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The PostgreSQL database pool.
 * @param {string} userId - The ID of the user attempting to vote.
 * @param {string} optionId - The ID of the option to be voted on.
 * @returns {Promise<boolean>} A promise that resolves to true if the user can vote on the option, false otherwise.
 */
export async function userCanVote(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  optionId: string,
) {
  if (!optionId) {
    return false;
  }
  // check if user has an approved registration
  const res = await dbPool
    .selectDistinct({
      user: db.registrations.userId,
    })
    .from(db.registrations)
    .where(and(eq(db.registrations.userId, userId), eq(db.registrations.status, 'APPROVED')));

  if (!res.length) {
    return false;
  }

  return true;
}
