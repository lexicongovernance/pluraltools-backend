import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import type { Request, Response } from 'express';
import { sql } from 'drizzle-orm';

export function getResultStatistics(dbPool: PostgresJsDatabase<typeof db>) {
  // Retrieves aggregate statistics for the results page, including total number of proposals,
  // total allocated hearts, number of participants, number of groups, and individual results.
  // @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
  // @returns {Promise<void>} - A promise that resolves with the aggregated statistics JSON response.
  return async function (req: Request, res: Response) {
    try {
      const forumQuestionId = req.params.forumQuestionId;

      // Execute all queries concurrently
      const [
        queryResultNumProposals,
        queryResultAllocatedHearts,
        queryNumOfParticipants,
        queryNumOfGroups,
        queryIndivStatistics,
      ] = await Promise.all([
        // Get total number of proposals
        dbPool.execute<{ numProposals: number }>(
          sql.raw(`
            SELECT count("id") AS "numProposals" 
            FROM question_options
            WHERE question_id = '${forumQuestionId}'
          `),
        ),

        // Get total allocated hearts
        dbPool.execute<{ sumNumOfHearts: number }>(
          sql.raw(`
            SELECT sum(num_of_votes) AS "sumNumOfHearts"
            FROM (
                SELECT user_id, num_of_votes, updated_at,
                    ROW_NUMBER() OVER (PARTITION BY user_id, option_id ORDER BY updated_at DESC) as row_num
                FROM votes
                WHERE question_id = '${forumQuestionId}'
                ) AS ranked 
            WHERE row_num = 1
            `),
        ),

        // Get number of Participants
        dbPool.execute<{ numOfParticipants: number }>(
          sql.raw(`
            SELECT count(DISTINCT user_id) AS "numOfParticipants"
            FROM votes 
            WHERE question_id = '${forumQuestionId}'
            `),
        ),

        // Get number of Groups
        dbPool.execute<{ numOfGroups: number }>(
          sql.raw(`
            WITH votes_users AS (
                SELECT DISTINCT user_id
                FROM votes 
                WHERE question_id = '${forumQuestionId}'
            )
   
            SELECT count(DISTINCT group_id) AS "numOfGroups"
            FROM users_to_groups
            WHERE user_id IN (SELECT user_id FROM votes_users)
            `),
        ),

        // Get individual results
        dbPool.execute<{
          optionId: string;
          optionTitle: string;
          pluralityScore: number;
          distinctUsers: number;
          allocatedHearts: number;
        }>(
          sql.raw(`
            WITH distinct_voters_by_option AS (
                SELECT option_id AS "optionId", count(DISTINCT user_id) AS "distinctUsers" 
                FROM votes
                WHERE question_id = '${forumQuestionId}'
                GROUP BY option_id
            ),
            
            plural_score_and_title AS (
                SELECT "id" AS "optionId", "option_title" AS "optionTitle", vote_count AS "pluralityScore"
                FROM question_options
                WHERE question_id = '${forumQuestionId}'
            ),
            
            allocated_hearts AS (
                SELECT option_id AS "optionId", sum(num_of_votes) AS "allocatedHearts"
                FROM (
                    SELECT user_id, option_id, num_of_votes, updated_at,
                    ROW_NUMBER() OVER (PARTITION BY user_id, option_id ORDER BY updated_at DESC) as row_num
                    FROM votes
                    WHERE question_id = '${forumQuestionId}'
                    ) AS ranked 
                WHERE row_num = 1
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
        ),
      ]);

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
          pluralityScore: indivPluralityScore || 0,
          distinctUsers: indivDistinctUsers || 0,
          allocatedHearts: indivAllocatedHearts || 0,
        };
      });

      const responseData = {
        numProposals: numProposals || 0,
        sumNumOfHearts: sumNumOfHearts || 0,
        numOfParticipants: numOfParticipants || 0,
        numOfGroups: numOfGroups || 0,
        optionStats: indivStats,
      };

      return res.json({ data: responseData });
    } catch (error) {
      console.error('Error in getResultStatistics:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
