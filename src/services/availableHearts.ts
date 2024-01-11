import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { sql } from 'drizzle-orm';

export function availableHearts(
  numProposals: number,
  baseNumerator: number,
  baseDenominator: number,
  maxRatio: number,
  customHearts: number | null = null,
): number | null {
  // Calculates number of hearts that a participant has available. The underlying assumption of the calculation is
  // that a participant must assign at least one heart to each available proposal.
  // :param: numProposals: number of proposals (options) that can be votes on.
  // :param: baseNumerator: specifies the minimum amounts of hearts a participant must allocate to a given proposal to satisfy the max ratio.
  // :param: baseDenominator: specifies the minimum amount of hearts a participant must have available to satisfy the max ratio.
  // :param: maxRatio: specifies the preference ratio a participant should be able to express over two project options.
  // :param: customHearts: if this parameter is set then the function will return custom hearts independent of the number of projects.
  // :returns: number of a available heart for each participant given a number of proposals.

  if (customHearts !== null) {
    return customHearts;
  }

  const maxVotes = baseNumerator + (numProposals - 2) * baseNumerator;
  const minHearts = baseDenominator + (numProposals - 2) * baseDenominator;

  if (maxVotes / minHearts !== maxRatio) {
    console.error('baseNumerator/baseDenominator does not equal the specified max ratio');
    return 0;
  }

  return minHearts;
}

export async function getAvailableHearts(dbPool: PostgresJsDatabase<typeof db>) {
  // The function returns the number of hearts depending on the number of options available.

  // Query num_of_votes and user_id for a specific option_id
  const numOptions = await dbPool.execute<{ countOptions: number }>(
    sql.raw(`
      SELECT count("id") AS "countOptions"   
      FROM question_options 
    `),
  );

  const countOptions = numOptions[0]?.countOptions;

  // calculate available hearts
  if (countOptions !== undefined) {
    const result = availableHearts(countOptions, 4, 5, 0.8, 100);
    return result;
  } else {
    // retrun 0 in case there are no options available yet.
    return 0;
  }
}
