import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { insertOptionsSchema } from '../types/options';
import { fieldsSchema } from '../types';
import { enforceRules } from './validation';

/**
 * Calculates number of hearts that a participant has available. The underlying assumption of the calculation is
  that a participant must assign at least one heart to each available proposal.
 */
export function availableHearts(
  numProposals: number,
  baseNumerator: number,
  baseDenominator: number,
  maxRatio: number,
  customHearts: number | null = null,
): number | null {
  if (customHearts !== null && customHearts >= 2) {
    return customHearts;
  }

  if (numProposals < 2) {
    console.error('Number of proposals must be at least 2');
    return 0;
  }

  const maxVotes = baseNumerator + (numProposals - 2) * baseNumerator;
  const minHearts = baseDenominator + (numProposals - 2) * baseDenominator;

  if (maxVotes / minHearts !== maxRatio) {
    console.error('baseNumerator/baseDenominator does not equal the specified max ratio');
    return 0;
  }

  return minHearts;
}

export async function getQuestionHearts(
  dbPool: NodePgDatabase<typeof schema>,
  data: {
    forumQuestionId: string;
  },
): Promise<number> {
  const { forumQuestionId } = data;

  // Fetch hearts for each active question
  const numOptions = await dbPool.execute<{ countOptions: number }>(
    sql.raw(`
            SELECT count("id") AS "countOptions"   
            FROM question_options
            WHERE question_id = '${forumQuestionId}'
          `),
  );

  const countOptions = numOptions.rows[0]?.countOptions;

  // Calculate available hearts
  if (countOptions !== undefined) {
    const result = availableHearts(countOptions, 4, 5, 0.8, null);

    if (result === null) {
      return 0;
    }

    return result;
  } else {
    // Return 0 in case there are no options available yet.
    return 0;
  }
}

export async function validateQuestionFields({
  option,
  dbPool,
}: {
  dbPool: NodePgDatabase<typeof schema>;
  option: z.infer<typeof insertOptionsSchema>;
}) {
  const rows = await dbPool
    .select()
    .from(schema.questions)
    .where(eq(schema.questions.id, option.questionId));

  if (!rows.length) {
    return [];
  }

  const question = rows[0];

  if (!question) {
    return [];
  }

  // get registration fields for the event
  const questionFields = fieldsSchema.safeParse(question.fields);

  if (!questionFields.success) {
    return [];
  }

  return enforceRules({
    data: option.data,
    fields: questionFields.data,
  });
}
