import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import type { Request, Response } from 'express';
import { sql } from 'drizzle-orm';

export function getResultStatistics(dbPool: PostgresJsDatabase<typeof db>) {
  // Returns the aggregate statistics for the results page
  return async function (req: Request, res: Response) {
    const forumQuestionId = req.params.forumQuestionId;

    // Get total number of proposals
    const queryResultNumProposals = await dbPool.execute<{ numProposals: number }>(
      sql.raw(`
            SELECT count("id") AS "numProposals" 
            FROM question_options
            WHERE question_id = '${forumQuestionId}'
          `),
    );

    // Get total allocated hearts
    const queryResultAllocatedHearts = await dbPool.execute<{ sumNumOfHearts: number }>(
      sql.raw(`
            WITH votes_question_id AS (
                SELECT * 
                FROM votes 
                WHERE option_id IN (
                    SELECT "id" AS "optionId"
                    FROM question_options
                    WHERE question_id = '${forumQuestionId}'
                )
            )
            
            SELECT sum(num_of_votes) AS "sumNumOfHearts"
            FROM (
                SELECT user_id, num_of_votes, updated_at,
                    ROW_NUMBER() OVER (PARTITION BY user_id, option_id ORDER BY updated_at DESC) as row_num
                FROM votes_question_id 
                ) AS ranked 
            WHERE row_num = 1
            `),
    );

    // Get number of Participants
    const queryNumOfParticipants = await dbPool.execute<{ numOfParticipants: number }>(
      sql.raw(`
            SELECT count(DISTINCT user_id) AS "numOfParticipants"
            FROM votes 
            WHERE option_id IN (
                SELECT "id" AS "optionId"
                FROM question_options
                WHERE question_id = '${forumQuestionId}'
                )
            `),
    );

    // Get number of Groups
    const queryNumOfGroups = await dbPool.execute<{ numOfGroups: number }>(
      sql.raw(`
            WITH votes_question_id AS (
                SELECT DISTINCT user_id
                FROM votes 
                WHERE option_id IN (
                    SELECT "id" AS "optionId"
                    FROM question_options
                    WHERE question_id = '${forumQuestionId}'
                )
            )
   
            SELECT count(DISTINCT group_id) AS "numOfGroups"
            FROM users_to_groups
            WHERE user_id IN (SELECT user_id FROM votes_question_id)
              `),
    );

    // Get individual results
    const queryIndivStatistics = await dbPool.execute<{
      optionId: string;
      optionTitle: string;
      pluralityScore: number;
      distinctUsers: number;
      allocatedHearts: number;
    }>(
      sql.raw(`
            WITH question_option_ids AS (
                SELECT "id" AS "optionId"
                FROM question_options
                WHERE question_id = '${forumQuestionId}'
            ),
            
            distinct_voters_by_option AS (
                SELECT option_id AS "optionId", count(DISTINCT user_id) AS "distinctUsers" 
                FROM votes
                WHERE option_id IN (SELECT "optionId" FROM question_option_ids)
                GROUP BY option_id
            ),
            
            plural_score_and_title AS (
                SELECT "id" AS "optionId", "text" AS "optionTitle", vote_count AS "pluralityScore"
                FROM question_options
                WHERE "id" IN (SELECT "optionId" FROM question_option_ids)
            ),
            
            allocated_hearts AS (
                SELECT option_id AS "optionId", sum(num_of_votes) AS "allocatedHearts"
                FROM (
                    SELECT user_id, option_id, num_of_votes, updated_at,
                    ROW_NUMBER() OVER (PARTITION BY user_id, option_id ORDER BY updated_at DESC) as row_num
                    FROM votes
                    ) AS ranked 
                WHERE row_num = 1
                AND option_id IN (SELECT "optionId" FROM question_option_ids)
                GROUP BY option_id
            ),
            
            merged_result AS (
                SELECT id_title_score."optionId", id_title_score."optionTitle",
                    id_title_score."pluralityScore", distinct_users."distinctUsers",
                    hearts."allocatedHearts"
                FROM plural_score_and_title AS id_title_score
                LEFT JOIN distinct_voters_by_option AS distinct_users 
                ON id_title_score."optionId" = distinct_users."optionId"
                LEFT JOIN allocated_hearts AS hearts 
                ON id_title_score."optionId" = hearts."optionId"
            )

            SELECT *
            FROM merged_result
                `),
    );

    const numProposals = queryResultNumProposals[0]?.numProposals;
    const sumNumOfHearts = queryResultAllocatedHearts[0]?.sumNumOfHearts;
    const numOfParticipants = queryNumOfParticipants[0]?.numOfParticipants;
    const numOfGroups = queryNumOfGroups[0]?.numOfGroups;
    const indivStats: Record<
      string,
      {
        optionTitle: string;
        pluralityScore: number;
        distinctUsers: number;
        allocatedHearts: number;
      }
    > = {};

    // Loop through each row in queryIndivStatistics
    queryIndivStatistics.forEach((row) => {
      const {
        optionId: indivOptionId,
        optionTitle: indivOptionTitle,
        pluralityScore: indivPluralityScore,
        distinctUsers: indivDistinctUsers,
        allocatedHearts: indivAllocatedHearts,
      } = row;

      indivStats[indivOptionId] = {
        optionTitle: indivOptionTitle || 'No Title Provided',
        pluralityScore: indivPluralityScore !== undefined ? indivPluralityScore : 0,
        distinctUsers: indivDistinctUsers !== undefined ? indivDistinctUsers : 0,
        allocatedHearts: indivAllocatedHearts !== undefined ? indivAllocatedHearts : 0,
      };
    });

    const responseData = {
      numProposals: numProposals !== undefined ? numProposals : 0,
      sumNumOfHearts: sumNumOfHearts !== undefined ? sumNumOfHearts : 0,
      numOfParticipants: numOfParticipants !== undefined ? numOfParticipants : 0,
      numOfGroups: numOfGroups !== undefined ? numOfGroups : 0,
      optionStats: indivStats,
    };

    return res.json({ data: responseData });
  };
}
