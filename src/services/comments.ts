import { eq, and, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { insertCommentSchema } from '../types';
import { z } from 'zod';
import * as db from '../db';

/**
 * Inserts a new comment into the database.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database pool connection.
 * @param {z.infer<typeof insertCommentSchema>} data - The comment data to insert.
 * @param {string} userId - The ID of the user making the comment.
 * @returns {Promise<Comment>} - A promise that resolves with the inserted comment.
 * @throws {Error} - Throws an error if the insertion fails.
 */
export async function saveComment(
  dbPool: PostgresJsDatabase<typeof db>,
  data: z.infer<typeof insertCommentSchema>,
  userId: string,
) {
  try {
    const newComment = await dbPool
      .insert(db.comments)
      .values({
        userId: userId,
        questionOptionId: data.questionOptionId,
        value: data.value,
      })
      .returning();
    return newComment[0];
  } catch (error) {
    console.error('Error in insertComment: ', error);
    throw new Error('Failed to insert comment');
  }
}

/**
 * Deletes a comment from the database, along with associated likes if any.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database pool connection.
 * @returns {Promise<void>} - A promise that resolves once the comment and associated likes are deleted.
 * @throws {Error} - Throws an error if the deletion fails.
 */
export async function deleteComment(
  dbPool: PostgresJsDatabase<typeof db>,
  data: {
    commentId: string;
    userId: string;
  },
): Promise<{ errors?: string[]; data?: db.Comment }> {
  const { commentId, userId } = data;

  // Only the author of the comment has the authorization to delete the comment
  const comment = await dbPool.query.comments.findFirst({
    where: and(eq(db.comments.id, commentId), eq(db.comments.userId, userId)),
  });

  if (!comment) {
    return { errors: ['Unauthorized to delete comment'] };
  }

  // Delete all likes associated with the deleted comment
  await dbPool.delete(db.likes).where(eq(db.likes.commentId, commentId));

  // Delete the comment
  const deletedComment = await dbPool
    .delete(db.comments)
    .where(eq(db.comments.id, commentId))
    .returning();

  return { data: deletedComment[0] };
}

export async function getOptionComments(
  dbPool: PostgresJsDatabase<typeof db>,
  data: {
    optionId: string;
  },
) {
  // Query comments
  const rows = await dbPool
    .select()
    .from(db.comments)
    .leftJoin(db.users, eq(db.comments.userId, db.users.id))
    .where(eq(db.comments.questionOptionId, data.optionId));

  const commentsWithUserNames = rows.map((row) => {
    return {
      id: row.comments.id,
      userId: row.comments.userId,
      questionOptionId: row.comments.questionOptionId,
      value: row.comments.value,
      createdAt: row.comments.createdAt,
      user: {
        id: row.users?.id,
        username: row.users?.username,
        firstName: row.users?.firstName,
        lastName: row.users?.lastName,
      },
    };
  });

  return commentsWithUserNames;
}

/**
 * Checks whether a user can comment based on their registration status.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The PostgreSQL database pool.
 * @param {string} userId - The ID of the user attempting to comment.
 * @param {string | undefined | null} optionId - The ID of the option for which the user is attempting to comment.
 * @returns {Promise<boolean>} A promise that resolves to true if the user can comment, false otherwise.
 */
export async function userCanComment(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  optionId: string | undefined | null,
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

type GetOptionUsersResponse = {
  optionId: string;
  registrationId: string;
  userId: string;
  group: {
    id: string;
    users: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
    }[];
  };
};

/**
 * Executes a query to retrieve user data related to a question option from the database.
 *
 * @param {string} optionId - The ID of the question option for which author data is to be retrieved.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The PostgreSQL database pool instance.
 * @returns {Promise<UserData | null>} - A promise resolving to user data related to the question question or null if no data found.
 */
export async function getOptionUsers(
  optionId: string,
  dbPool: PostgresJsDatabase<typeof db>,
): Promise<GetOptionUsersResponse | null> {
  try {
    const queryUsers = await dbPool.execute<{
      optionId: string;
      registrationId: string;
      userId: string;
      group: {
        id: string;
        users: {
          id: string;
          username: string;
          firstName: string;
          lastName: string;
        }[];
      };
    }>(
      sql.raw(`
        WITH secret_groups AS (
          SELECT id AS "group_id"
          FROM groups
          WHERE secret IS NOT NULL
        ),

        users_secret_groups AS (
          SELECT users."id" AS "user_id", users."username", users."first_name", users."last_name", users_to_groups."group_id" 
          FROM users_to_groups
		      LEFT JOIN users 
		      ON users_to_groups."user_id" = users."id"
		      WHERE group_id IN (SELECT group_id FROM secret_groups)
        ),

        agg_users_secret_groups AS (
          SELECT 
              group_id, 
              json_agg(
                  json_build_object(
                      'id', user_id,
                      'username', username,
                      'firstName', first_name,
                      'lastName', last_name
                  )
              ) AS "users_in_group"
          FROM users_secret_groups
          GROUP BY group_id
      ),

      option_owner AS (
        SELECT 
        question_options."id", users."id" AS "user_id",
            json_build_object(
                'id', users."id",
                'username', users."username",
                'firstName', users."first_name",
                'lastName', users."last_name"
            ) AS option_owner
        FROM question_options
        LEFT JOIN users ON question_options."user_id" = users."id"
      ),
    
      registrations_secret_groups AS (
        SELECT registrations."id", registrations."group_id", agg_users_secret_groups."users_in_group"
        FROM registrations
        LEFT JOIN agg_users_secret_groups ON registrations."group_id" = agg_users_secret_groups."group_id"
        WHERE registrations."group_id" IS NOT NULL
      ),
      
      result AS (
        SELECT 
          question_options."id" AS "optionId",
          question_options."registration_id" AS "registrationId",
          question_options."user_id" AS "userId",
          option_owner."option_owner" AS "user",
          registrations_secret_groups."group_id" AS "groupId",
          registrations_secret_groups."users_in_group" AS "usersInGroup" 
        FROM question_options
        LEFT JOIN registrations_secret_groups ON question_options."registration_id" = registrations_secret_groups."id"
        LEFT JOIN option_owner ON question_options."user_id" = option_owner."user_id"
        WHERE question_options."id" = '${optionId}'
      ),

      nested_result AS (
        SELECT "optionId", "registrationId", result."userId", "user", result."groupId",
          json_build_object(
                'id', result."groupId",
                'users', result."usersInGroup"
          ) AS group
        FROM result
      )

      SELECT * 
      FROM nested_result 
        `),
    );

    // Return the first row of query result or null if no data found
    return queryUsers[0] || null;
  } catch (error) {
    console.error('Error in getOptionUsers:', error);
    throw new Error('Error executing database query');
  }
}
