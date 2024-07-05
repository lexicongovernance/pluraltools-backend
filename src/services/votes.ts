import { and, eq, sql } from 'drizzle-orm';
import * as db from '../db';
import { votes } from '../db/votes';
import { PluralVoting } from '../modules/plural-voting';
import { insertVotesSchema } from '../types';
import { CycleStatusType } from '../types/cycles';
import { z } from 'zod';
import { quadraticVoting } from '../modules/quadratic-voting';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Validates and saves votes submitted by a user.
 *
 * This function validates each vote provided in the `data` array for the specified `userId`.
 * If all votes are valid, it saves each vote to the database.
 *
 * @param {NodePgDatabase<typeof db>} dbPool
 * @param {{ optionId: string; numOfVotes: number }[]} data
 * @param {string} userId
 * @returns {Promise<{ data: db.Vote[] | null; errors: string[] }>}
 */
export async function validateAndSaveVotes(
  dbPool: NodePgDatabase<typeof db>,
  data: { optionId: string; numOfVotes: number }[],
  userId: string,
): Promise<{ data: db.Vote[] | null; questionIds: string[]; errors: string[] }> {
  const voteData: db.Vote[] = [];
  const questionIds: string[] = [];
  const errors: string[] = [];

  for (const vote of data) {
    // Validate the vote
    const { isValid, error } = await validateVote(dbPool, vote, userId);
    if (!isValid && error) {
      errors.push(error);
      continue;
    }

    // Find the question option if the vote is valid
    const queryQuestionOption = await dbPool.query.options.findFirst({
      where: eq(db.options.id, vote.optionId),
    });

    if (!queryQuestionOption) {
      errors.push(`No option found for optionId: ${vote.optionId}`);
      continue;
    }

    // Save the vote
    const { data: savedVote, error: saveError } = await saveVote(
      dbPool,
      vote,
      userId,
      queryQuestionOption.questionId,
    );
    if (saveError) {
      errors.push(saveError);
    } else if (savedVote) {
      voteData.push(savedVote);
      questionIds.push(queryQuestionOption.questionId);
    }
  }

  return { data: voteData.length > 0 ? voteData : null, questionIds, errors };
}

/**
 * Saves votes submitted by a user and updates option scores based on the vote model.
 *
 * @param {NodePgDatabase<typeof db>} dbPool
 * @param {{ optionId: string; numOfVotes: number }[]} data
 * @param {string[]} questionIds
 * @returns {Promise<{ data: { optionId: string; score: number }[] | null; errors: string[] }>}
 */
export async function updateOptionScore(
  dbPool: NodePgDatabase<typeof db>,
  data: { optionId: string; numOfVotes: number }[],
  questionIds: string[],
): Promise<{ data: { optionId: string; score: number }[] | null; errors: string[] }> {
  const scores: { optionId: string; score: number }[] = [];
  const errors: string[] = [];

  // Check if all questionIds are the same
  const firstQuestionId = questionIds[0];
  if (!questionIds.every((questionId) => questionId === firstQuestionId)) {
    errors.push('Not all questionIds are the same');
    return { data: null, errors };
  }

  // Query group data, grouping dimensions, and calculate the score
  const queryForumQuestion = await dbPool
    .select({
      questionId: db.questions.id,
      voteModel: db.questions.voteModel,
    })
    .from(db.questions)
    .where(eq(db.questions.id, firstQuestionId!));

  if (!queryForumQuestion) {
    errors.push('No question found for the provided questionId');
    return { data: null, errors };
  }

  const voteModel = queryForumQuestion[0]?.voteModel;

  // Call the update function based on the respective voting mechanism
  switch (voteModel) {
    case 'COCM':
      await Promise.all(
        data.map(async (vote) => {
          try {
            const score = await updateVoteScorePlural(
              dbPool,
              vote.optionId,
              queryForumQuestion[0]!.questionId,
            );
            scores.push({ optionId: vote.optionId, score: score });
          } catch (error) {
            errors.push(`Error updating score for optionId ${vote.optionId}`);
          }
        }),
      );
      break;
    case 'QV':
      await Promise.all(
        data.map(async (vote) => {
          try {
            const score = await updateVoteScoreQuadratic(dbPool, vote.optionId);
            scores.push({ optionId: vote.optionId, score: score });
          } catch (error) {
            errors.push(`Error updating score for optionId ${vote.optionId}`);
          }
        }),
      );
      break;
    default:
      errors.push('Unsupported vote model: ' + voteModel);
      break;
  }

  return { data: scores.length > 0 ? scores : null, errors };
}

/**
Queries latest vote data by users for a specified option ID.
@param { NodePgDatabase<typeof db>} dbPool - The database connection pool.
@param {string} optionId - The ID of the option for which to query vote data.
*/
export async function queryVoteData(dbPool: NodePgDatabase<typeof db>, optionId: string) {
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
  return voteArray.rows;
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
 * Queries the group categories associated with a given question ID from the database.
 *
 * @param dbPool - The database pool to use for querying.
 * @param questionId - The ID of the question to retrieve group categories for.
 * @returns A promise that resolves to an object containing:
 *   - `data`: An array of group category IDs if found, otherwise `null`.
 *   - `error`: A string describing the error if no group categories are found, otherwise `null`.
 */
export async function queryGroupCategories(
  dbPool: NodePgDatabase<typeof db>,
  questionId: string,
): Promise<{ data: string[] | null; error: string | null }> {
  const groupCategories = await dbPool
    .select({
      groupCategoryId: db.questionsToGroupCategories.groupCategoryId,
    })
    .from(db.questionsToGroupCategories)
    .where(eq(db.questionsToGroupCategories.questionId, questionId));

  if (groupCategories.length === 0) {
    return { data: null, error: 'No group categories found for the given question Id' };
  }

  const groupCategoryIds: string[] = groupCategories.map((category) => category.groupCategoryId);

  return { data: groupCategoryIds, error: null };
}

/**
 * Queries group data and creates group dictionary based on user IDs and option ID.
 * @param {Record<string, number>} numOfVotesDictionary - Dictionary of user IDs and their respective number of votes.
 * @param {Array<string>} groupCategoryIds - Array of group category IDs.
 * @returns {Promise<Record<string, string[]>>} - Dictionary of group IDs and their corresponding user IDs.
 */
export async function groupsDictionary(
  dbPool: NodePgDatabase<typeof db>,
  numOfVotesDictionary: Record<string, number>,
  groupCategories: Array<string>,
) {
  const groupArray = await dbPool.execute<{ groupId: string; userIds: string[] }>(
    sql.raw(`
      SELECT group_id AS "groupId", json_agg(user_id) AS "userIds"
      FROM users_to_groups
      WHERE user_id IN (${Object.keys(numOfVotesDictionary)
        .map((id) => `'${id}'`)
        .join(', ')})
      AND group_category_id IN (${groupCategories.map((category) => `'${category}'`).join(', ')})
      GROUP BY group_id
    `),
  );

  const groupsDictionary = groupArray.rows.reduce(
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
@param { NodePgDatabase<typeof db>} dbPool - The database connection pool.
@param {string} optionId - The ID of the option for which to update the vote score.
@param {number} score - The new vote score to be set.
*/
export async function updateVoteScoreInDatabase(
  dbPool: NodePgDatabase<typeof db>,
  optionId: string,
  score: number,
) {
  await dbPool
    .update(db.options)
    .set({
      voteScore: score.toString(),
      updatedAt: new Date(),
    })
    .where(eq(db.options.id, optionId));
}

/**
 * Updates the vote score for a specific option in the database according to the plural voting model.
 *
 * This function queries vote and multiplier data from the database,
 * combines them, calculates the score using plural voting, updates
 * the vote score in the database, and returns the calculated score.
 *
 * @param { NodePgDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string} optionId - The ID of the option for which to update the vote score.
 */
export async function updateVoteScorePlural(
  dbPool: NodePgDatabase<typeof db>,
  optionId: string,
  questionId: string,
): Promise<number> {
  // Query and transform vote data
  const voteArray = await queryVoteData(dbPool, optionId);
  const votesDictionary = await numOfVotesDictionary(voteArray);
  const groupCategories = await queryGroupCategories(dbPool, questionId);
  const groupArray = await groupsDictionary(dbPool, votesDictionary, groupCategories.data!);
  const score = await calculatePluralScore(groupArray, votesDictionary);

  await updateVoteScoreInDatabase(dbPool, optionId, score);

  return score;
}

/**
 * Updates the vote score for a specific option in the database according to the quadratic voting model.
 *
 * This function queries vote and multiplier data from the database,
 * combines them, calculates the score using quadratic voting, updates
 * the vote score in the database, and returns the calculated score.
 *
 * @param { NodePgDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string} optionId - The ID of the option for which to update the vote score.
 */
export async function updateVoteScoreQuadratic(
  dbPool: NodePgDatabase<typeof db>,
  optionId: string,
): Promise<number> {
  const voteArray = await queryVoteData(dbPool, optionId);
  const votesDictionary = await numOfVotesDictionary(voteArray);
  const score = await calculateQuadraticScore(votesDictionary);

  await updateVoteScoreInDatabase(dbPool, optionId, score);

  return score;
}

/**
 * This function performs several validation steps for the provided vote object:
 * 1. Checks if the option ID is provided.
 * 2. Verifies the existence of the option in the database.
 * 3. Confirms that the associated voting cycle is open.
 * 4. Checks if the user is eligible to vote.
 *
 * If all validations pass, the vote is considered valid. Otherwise, an appropriate error message is returned.
 *
 * @param {NodePgDatabase<typeof db>} dbPool
 * @param {{ optionId: string; numOfVotes: number }} vote
 * @param {string} userId
 * @returns {Promise<{ isValid: boolean; error: string | null }>}
 */
export async function validateVote(
  dbPool: NodePgDatabase<typeof db>,
  vote: { optionId: string; numOfVotes: number },
  userId: string,
): Promise<{ isValid: boolean; error: string | null }> {
  if (!vote.optionId) {
    return { isValid: false, error: 'Option Id is required' };
  }

  // check if the option exists
  const queryQuestionOption = await dbPool.query.options.findFirst({
    where: eq(db.options.id, vote.optionId),
  });

  if (!queryQuestionOption) {
    return { isValid: false, error: 'Option not found' };
  }

  // check cycle status
  const queryQuestion = await dbPool.query.questions.findFirst({
    where: eq(db.questions.id, queryQuestionOption.questionId),
    with: {
      cycle: true,
    },
  });

  if ((queryQuestion?.cycle?.status as CycleStatusType) !== 'OPEN') {
    return { isValid: false, error: 'Cycle is not open' };
  }

  // check if the user can vote
  const canVote = await userCanVote(dbPool, userId, vote.optionId);
  if (!canVote) {
    return { isValid: false, error: 'User cannot vote' };
  }

  return { isValid: true, error: null };
}

/**
 * Saves a vote in the database.
 *
 * @param { NodePgDatabase<typeof db>} dbPool
 * @param {z.infer<typeof insertVotesSchema>} vote
 * @param {string} userId
 * @param {string} questionId
 */
export async function saveVote(
  dbPool: NodePgDatabase<typeof db>,
  vote: { optionId: string; numOfVotes: number },
  userId: string,
  questionId: string,
): Promise<{ data: db.Vote | null; error: string | null | undefined }> {
  const insertVoteBody: z.infer<typeof insertVotesSchema> = {
    optionId: vote.optionId,
    numOfVotes: vote.numOfVotes,
    userId: userId,
    questionId: questionId,
  };

  const body = insertVotesSchema.safeParse(insertVoteBody);

  if (!body.success) {
    return { data: null, error: body.error.errors[0]?.message };
  }

  // save the votes
  const newVote = await dbPool
    .insert(votes)
    .values({
      userId: insertVoteBody.userId,
      numOfVotes: insertVoteBody.numOfVotes,
      optionId: insertVoteBody.optionId,
      questionId: insertVoteBody.questionId,
    })
    .returning();

  if (!newVote || newVote.length === 0 || !newVote[0]) {
    return { data: null, error: 'Failed to insert vote in the db' };
  }

  return { data: newVote[0], error: null };
}

/**
 * Checks whether a user can vote on an option based on their registration status.
 * @param { NodePgDatabase<typeof db>} dbPool - The PostgreSQL database pool.
 * @param {string} userId - The ID of the user attempting to vote.
 * @param {string} optionId - The ID of the option to be voted on.
 * @returns {Promise<boolean>} A promise that resolves to true if the user can vote on the option, false otherwise.
 */
export async function userCanVote(
  dbPool: NodePgDatabase<typeof db>,
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
