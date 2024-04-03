import { eq, and } from 'drizzle-orm';
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
