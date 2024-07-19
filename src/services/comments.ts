import { eq, and, sql } from 'drizzle-orm';
import { insertCommentSchema } from '../types';
import { z } from 'zod';
import * as schema from '../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { logger } from '../utils/logger';

/**
 * Inserts a new comment into the database.
 * @throws {Error} - Throws an error if the insertion fails.
 */
export async function saveComment(
  dbPool: NodePgDatabase<typeof schema>,
  data: z.infer<typeof insertCommentSchema>,
  userId: string,
) {
  try {
    const newComment = await dbPool
      .insert(schema.comments)
      .values({
        userId: userId,
        optionId: data.optionId,
        value: data.value,
      })
      .returning();
    return newComment[0];
  } catch (error) {
    logger.error('Error in insertComment: ', error);
    throw new Error('Failed to insert comment');
  }
}

/**
 * Deletes a comment from the database, along with associated likes if any.
 * @throws {Error} - Throws an error if the deletion fails.
 */
export async function deleteComment(
  dbPool: NodePgDatabase<typeof schema>,
  data: {
    commentId: string;
    userId: string;
  },
): Promise<{ errors?: string[]; data?: schema.Comment }> {
  const { commentId, userId } = data;

  // Only the author of the comment has the authorization to delete the comment
  const comment = await dbPool.query.comments.findFirst({
    where: and(eq(schema.comments.id, commentId), eq(schema.comments.userId, userId)),
  });

  if (!comment) {
    return { errors: ['Unauthorized to delete comment'] };
  }

  // Delete all likes associated with the deleted comment
  await dbPool.delete(schema.likes).where(eq(schema.likes.commentId, commentId));

  // Delete the comment
  const deletedComment = await dbPool
    .delete(schema.comments)
    .where(eq(schema.comments.id, commentId))
    .returning();

  return { data: deletedComment[0] };
}

export async function getOptionComments(
  dbPool: NodePgDatabase<typeof schema>,
  data: {
    optionId: string;
  },
) {
  // Query comments
  const rows = await dbPool
    .select()
    .from(schema.comments)
    .leftJoin(schema.users, eq(schema.comments.userId, schema.users.id))
    .where(eq(schema.comments.optionId, data.optionId));

  const commentsWithUserNames = rows.map((row) => {
    return {
      id: row.comments.id,
      userId: row.comments.userId,
      optionId: row.comments.optionId,
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
 * @returns {Promise<boolean>} A promise that resolves to true if the user can comment, false otherwise.
 */
export async function userCanComment(
  dbPool: NodePgDatabase<typeof schema>,
  userId: string,
  optionId: string | undefined | null,
) {
  if (!optionId) {
    return false;
  }

  // check if user has an approved registration
  const res = await dbPool
    .selectDistinct({
      user: schema.registrations.userId,
    })
    .from(schema.registrations)
    .where(
      and(eq(schema.registrations.userId, userId), eq(schema.registrations.status, 'APPROVED')),
    );

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
 */
export async function getOptionUsers(
  optionId: string,
  dbPool: NodePgDatabase<typeof schema>,
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
        options."id", users."id" AS "user_id",
            json_build_object(
                'id', users."id",
                'username', users."username",
                'firstName', users."first_name",
                'lastName', users."last_name"
            ) AS option_owner
        FROM options
        LEFT JOIN users ON options."user_id" = users."id"
      ),
    
      registrations_secret_groups AS (
        SELECT registrations."id", registrations."group_id", agg_users_secret_groups."users_in_group"
        FROM registrations
        LEFT JOIN agg_users_secret_groups ON registrations."group_id" = agg_users_secret_groups."group_id"
        WHERE registrations."group_id" IS NOT NULL
      ),
      
      result AS (
        SELECT 
          options."id" AS "optionId",
          options."registration_id" AS "registrationId",
          options."user_id" AS "userId",
          option_owner."option_owner" AS "user",
          registrations_secret_groups."group_id" AS "groupId",
          registrations_secret_groups."users_in_group" AS "usersInGroup" 
        FROM options
        LEFT JOIN registrations_secret_groups ON options."registration_id" = registrations_secret_groups."id"
        LEFT JOIN option_owner ON options."user_id" = option_owner."user_id"
        WHERE options."id" = '${optionId}'
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
    return queryUsers.rows[0] || null;
  } catch (error) {
    logger.error('Error in getOptionUsers:', error);
    throw new Error('Error executing database query');
  }
}
