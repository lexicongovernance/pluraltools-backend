import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { and, eq } from 'drizzle-orm';

export async function saveCommentLike(
  dbPool: NodePgDatabase<typeof schema>,
  data: {
    commentId: string;
    userId: string;
  },
): Promise<{
  data?: schema.Like;
  errors?: string[];
}> {
  const { commentId, userId } = data;

  const like = await dbPool.query.likes.findFirst({
    where: and(eq(schema.likes.commentId, commentId), eq(schema.likes.userId, userId)),
  });

  if (like) {
    return { data: like, errors: ['like already exists'] };
  }

  try {
    const newLike = await dbPool
      .insert(schema.likes)
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
  dbPool: NodePgDatabase<typeof schema>,
  data: {
    commentId: string;
    userId: string;
  },
): Promise<{
  data?: schema.Like;
  errors?: string[];
}> {
  const { commentId, userId } = data;

  const like = await dbPool.query.likes.findFirst({
    where: and(eq(schema.likes.commentId, commentId), eq(schema.likes.userId, userId)),
  });

  if (!like) {
    return { errors: ['like does not exist'] };
  }

  try {
    const deletedLike = await dbPool
      .delete(schema.likes)
      .where(eq(schema.likes.id, like.id))
      .returning();
    return { data: deletedLike[0] };
  } catch (e) {
    return { errors: ['Failed to delete like'] };
  }
}

/**
 * Checks whether a user can like a comment based on their registration status.
 */
export async function userCanLike(
  dbPool: NodePgDatabase<typeof schema>,
  userId: string,
  commentId: string,
) {
  if (!commentId) {
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
