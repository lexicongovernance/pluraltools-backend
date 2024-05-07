import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq, and } from 'drizzle-orm';

/**
 * Upserts the user-to-groups associations in the database for a given user.
 * If a user-to-group association already exists, it updates it. Otherwise, it inserts a new association.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string} userId - The ID of the user for whom the associations should be overwritten.
 * @param {string[]} newGroupIds - An array to associate with the user.
 * @returns {Promise<db.UsersToGroups[] | null>} - A promise resolving to an array of the new user-to-groups associations or null if there was an error.
 */
export async function upsertUsersToGroups(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  newGroupIds: string[],
): Promise<db.UsersToGroups[] | null> {
  try {
    for (const groupId of newGroupIds) {
      const group = await dbPool.query.groups.findFirst({
        where: eq(db.groups.id, groupId),
      });

      if (!group) {
        console.error('Group not found with ID:', groupId);
        continue;
      }

      // get group category id
      const groupCategoryId = group.groupCategoryId;

      // get all groups associated with a user by group category
      const existingAssociation = await dbPool.query.usersToGroups.findFirst({
        where: and(
          eq(db.usersToGroups.userId, userId),
          eq(db.usersToGroups.groupCategoryId, groupCategoryId!),
        ),
      });

      if (existingAssociation) {
        await dbPool
          .update(db.usersToGroups)
          .set({ userId, groupId, groupCategoryId, updatedAt: new Date() })
          .where(
            and(
              eq(db.usersToGroups.userId, userId),
              eq(db.usersToGroups.groupCategoryId, groupCategoryId!),
            ),
          );
      } else {
        await dbPool
          .insert(db.usersToGroups)
          .values({ userId, groupId, groupCategoryId })
          .returning();
      }
    }

    const newUserGroups = await dbPool.query.usersToGroups.findMany({
      where: eq(db.usersToGroups.userId, userId),
    });
    return newUserGroups;
  } catch (error) {
    console.error('Error upserting user groups: ' + JSON.stringify(error));
    return null;
  }
}

export async function deleteUsersToGroups(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  usersToGroupsId: string,
) {
  return await dbPool
    .delete(db.usersToGroups)
    .where(and(eq(db.usersToGroups.userId, userId), eq(db.usersToGroups.id, usersToGroupsId)))
    .returning();
}
