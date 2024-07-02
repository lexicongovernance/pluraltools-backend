import { eq } from 'drizzle-orm';
import * as db from '../db';
import { allocateFunding } from '../modules/funding-mechanism';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * calculates the funding amount for each option.
 *
 * @param { NodePgDatabase<typeof db>} dbPool - The PostgreSQL database pool instance.
 * @param {string} forumQuestionId - The ID of the forum question for which statistics are to be retrieved.
 * @returns {Promise<{ allocated_funding: { [key: string]: number }; remaining_funding: number }>}
 * - A promise resolving to an object containing the allocated funding for each project and the remaining funding.
 */
export async function calculateFunding(
  dbPool: NodePgDatabase<typeof db>,
  forumQuestionId: string,
): Promise<{ allocated_funding: { [key: string]: number }; remaining_funding: number }> {
  const getOptionData = await dbPool
    .select({
      id: db.options.id,
      voteScore: db.options.voteScore,
      fundingRequest: db.options.fundingRequest,
    })
    .from(db.options)
    .where(eq(db.options.questionId, forumQuestionId));

  if (!getOptionData) {
    throw new Error('Error in query getOptionData');
  }

  const funding = allocateFunding(100000, 10000, getOptionData);

  if (!funding) {
    throw new Error('Error in allocating funding');
  }

  return funding;
}
