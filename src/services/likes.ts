import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as db from '../db';
import { and, eq } from 'drizzle-orm';

export async function saveCommentLike(
  dbPool: NodePgDatabase<typeof db>,
  data: {
    commentId: string;
    userId: string;
  },
): Promise<{
  data?: db.Like;
  errors?: string[];
}> {
  const { commentId, userId } = data;

  const like = await dbPool.query.likes.findFirst({
    where: and(eq(db.likes.commentId, commentId), eq(db.likes.userId, userId)),
  });

  if (like) {
    return { data: like, errors: ['like already exists'] };
  }

  try {
    const newLike = await dbPool
      .insert(db.likes)
      .values({
        commentId,
        userId,
      })
      .returning();

    return { data: newLike[0] };
  } catch (e) {
    return { errors: ['Failed to save like'] };
  }
}

export async function deleteCommentLike(
  dbPool: NodePgDatabase<typeof db>,
  data: {
    commentId: string;
    userId: string;
  },
): Promise<{
  data?: db.Like;
  errors?: string[];
}> {
  const { commentId, userId } = data;

  const like = await dbPool.query.likes.findFirst({
    where: and(eq(db.likes.commentId, commentId), eq(db.likes.userId, userId)),
  });

  if (!like) {
    return { errors: ['like does not exist'] };
  }

  try {
    const deletedLike = await dbPool.delete(db.likes).where(eq(db.likes.id, like.id)).returning();
    return { data: deletedLike[0] };
  } catch (e) {
    return { errors: ['Failed to delete like'] };
  }
}

/**
 * Checks whether a user can like a comment based on their registration status.
 * @param { NodePgDatabase<typeof db>} dbPool - The PostgreSQL database pool.
 * @param {string} userId - The ID of the user attempting to like the comment.
 * @param {string} commentId - The ID of the comment to be liked.
 * @returns {Promise<boolean>} A promise that resolves to true if the user can like the comment, false otherwise.
 */
export async function userCanLike(
  dbPool: NodePgDatabase<typeof db>,
  userId: string,
  commentId: string,
) {
  if (!commentId) {
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
