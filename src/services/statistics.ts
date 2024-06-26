import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as db from '../db';
import { sql } from 'drizzle-orm';

type ResultData = {
  numProposals: number;
  sumNumOfHearts: number;
  numOfParticipants: number;
  numOfGroups: number;
  optionStats: Record<
    string,
    {
      optionTitle: string;
      optionSubTitle: string;
      pluralityScore: string;
      distinctUsers: number;
      allocatedHearts: number;
      quadraticScore: string;
      distinctGroups: number;
      listOfGroupNames: string[];
    }
  >;
};

/**
 * Executes multiple queries concurrently to retrieve statistics related to a forum question from the database.
 *
 * @param {string | undefined} forumQuestionId - The ID of the forum question for which statistics are to be retrieved.
 * @param { NodePgDatabase<typeof db>} dbPool - The PostgreSQL database pool instance.
 * @returns {Promise<unknown>} - A promise resolving to an object containing various statistics related to the forum question.
 */
export async function executeResultQueries(
  forumQuestionId: string | undefined,
  dbPool: NodePgDatabase<typeof db>,
): Promise<ResultData> {
  try {
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
          SELECT count("id")::int AS "numProposals" 
          FROM question_options
          WHERE question_id = '${forumQuestionId}'
          AND accepted = TRUE
        `),
      ),

      // Get total allocated hearts
      dbPool.execute<{ sumNumOfHearts: number }>(
        sql.raw(`
          SELECT sum(num_of_votes)::int AS "sumNumOfHearts"
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
          SELECT count(DISTINCT user_id)::int AS "numOfParticipants"
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
          ),

          question_categories AS (
            SELECT group_category_id
            FROM questions_to_group_categories
            WHERE question_id = '${forumQuestionId}'
          )
  
          SELECT count(DISTINCT group_id)::int AS "numOfGroups"
          FROM users_to_groups
          WHERE user_id IN (SELECT user_id FROM votes_users)
          AND users_to_groups.group_category_id IN (SELECT group_category_id FROM question_categories)
          `),
      ),

      // Get individual results
      dbPool.execute<{
        optionId: string;
        optionTitle: string;
        optionSubTitle: string;
        pluralityScore: string;
        distinctUsers: number;
        allocatedHearts: number;
        quadraticScore: string;
        distinctGroups: number;
        listOfGroupNames: string[];
      }>(
        sql.raw(`
          WITH distinct_voters_by_option AS (
              SELECT option_id AS "optionId", count(DISTINCT user_id)::int AS "distinctUsers" 
              FROM votes
              WHERE question_id = '${forumQuestionId}'
              GROUP BY option_id
          ),
          
          plural_score_and_title AS (
              SELECT "id" AS "optionId", "option_title" AS "optionTitle", "option_sub_title" AS "optionSubTitle", vote_score AS "pluralityScore"
              FROM question_options
              WHERE question_id = '${forumQuestionId}'
              AND accepted = TRUE -- makes sure to only expose data of accepted options
          ),
          
          allocated_hearts AS (
              SELECT option_id AS "optionId", sum(num_of_votes)::int AS "allocatedHearts"
              FROM (
                  SELECT user_id, option_id, num_of_votes, updated_at,
                  ROW_NUMBER() OVER (PARTITION BY user_id, option_id ORDER BY updated_at DESC) as row_num
                  FROM votes
                  WHERE question_id = '${forumQuestionId}'
                  ) AS ranked 
              WHERE row_num = 1
              GROUP BY option_id
          ),

          quadratic_score AS (
              SELECT option_id AS "optionId", sum(sqrt_votes)::numeric AS "quadraticScore"
	            FROM (
		              SELECT user_id, option_id, sqrt(num_of_votes) AS sqrt_votes, updated_at,
        	        ROW_NUMBER() OVER (PARTITION BY user_id, option_id ORDER BY updated_at DESC) as row_num
                  FROM votes
                  WHERE question_id = '${forumQuestionId}'
                  ) AS ranked 
              WHERE row_num = 1
	            GROUP BY option_id
          ),
          
          /* Query distinct groups and group names by option id */

          relevant_categories AS (
            SELECT group_category_id
            FROM questions_to_group_categories
            WHERE question_id = '${forumQuestionId}'
          ),

          user_group_name AS (
              SELECT users_to_groups."user_id", users_to_groups."group_id", groups."name" 
              FROM users_to_groups
              LEFT JOIN groups
              ON users_to_groups."group_id" = groups."id"
              WHERE users_to_groups.group_category_id IN (SELECT group_category_id FROM relevant_categories)
          ),
          
          option_user AS (
              SELECT option_id, user_id
              FROM votes
              WHERE question_id = '${forumQuestionId}'
              GROUP BY option_id, user_id
          ),
          
          option_user_group_name AS (
              SELECT option_user."user_id", option_user."option_id", 
                user_group_name."group_id", user_group_name."name"
              FROM option_user 
              LEFT JOIN user_group_name 
              ON option_user."user_id" = user_group_name."user_id"
          ),
          
          option_distinct_group_name AS (
              SELECT option_id AS "optionId", count(DISTINCT group_id)::int AS "distinctGroups", 
              STRING_TO_ARRAY(STRING_AGG(DISTINCT name, ';'), ';') AS "listOfGroupNames"
              FROM option_user_group_name
              GROUP BY option_id
          ),
          
          /* Aggregated results */
          merged_result AS (
              SELECT id_title_score."optionId", 
                    id_title_score."optionTitle",
                    id_title_score."optionSubTitle",
                    id_title_score."pluralityScore",
                    distinct_users."distinctUsers",
                    hearts."allocatedHearts",
                    quadratic_score."quadraticScore",
                    group_count_names."distinctGroups",
                    group_count_names."listOfGroupNames" 
              FROM plural_score_and_title AS id_title_score
              LEFT JOIN distinct_voters_by_option AS distinct_users 
              ON id_title_score."optionId" = distinct_users."optionId"
              LEFT JOIN allocated_hearts AS hearts 
              ON id_title_score."optionId" = hearts."optionId"
              LEFT JOIN quadratic_score AS quadratic_score 
              ON id_title_score."optionId" = quadratic_score."optionId"
              LEFT JOIN option_distinct_group_name AS group_count_names
              ON id_title_score."optionId" = group_count_names."optionId"
          )

          SELECT *
          FROM merged_result
              `),
      ),
    ]);

    const numProposals = queryResultNumProposals.rows[0]?.numProposals;
    const sumNumOfHearts = queryResultAllocatedHearts.rows[0]?.sumNumOfHearts;
    const numOfParticipants = queryNumOfParticipants.rows[0]?.numOfParticipants;
    const numOfGroups = queryNumOfGroups.rows[0]?.numOfGroups;
    const indivStats: Record<
      string,
      {
        optionTitle: string;
        optionSubTitle: string;
        pluralityScore: string;
        distinctUsers: number;
        allocatedHearts: number;
        quadraticScore: string;
        distinctGroups: number;
        listOfGroupNames: string[];
      }
    > = {};

    // Loop through each row in queryIndivStatistics
    queryIndivStatistics.rows.forEach((row) => {
      const {
        optionId: indivOptionId,
        optionTitle: indivOptionTitle,
        optionSubTitle: indivOptionSubTitle,
        pluralityScore: indivPluralityScore,
        distinctUsers: indivDistinctUsers,
        allocatedHearts: indivAllocatedHearts,
        quadraticScore: indivQuadraticScore,
        distinctGroups: indivdistinctGroups,
        listOfGroupNames: indivlistOfGroupNames,
      } = row;

      indivStats[indivOptionId] = {
        optionTitle: indivOptionTitle || 'No Title Provided',
        optionSubTitle: indivOptionSubTitle || '',
        pluralityScore: indivPluralityScore || '0.0',
        distinctUsers: indivDistinctUsers || 0,
        allocatedHearts: indivAllocatedHearts || 0,
        quadraticScore: indivQuadraticScore || '0.0',
        distinctGroups: indivdistinctGroups || 0,
        listOfGroupNames: indivlistOfGroupNames || [],
      };
    });

    const responseData = {
      numProposals: numProposals || 0,
      sumNumOfHearts: sumNumOfHearts || 0,
      numOfParticipants: numOfParticipants || 0,
      numOfGroups: numOfGroups || 0,
      optionStats: indivStats,
    };

    return responseData;
  } catch (error) {
    console.error('Error in executeQueries:', error);
    throw new Error('Error executing database queries');
  }
}
