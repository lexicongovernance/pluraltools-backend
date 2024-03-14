import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq, and } from 'drizzle-orm';

/**
 * Overwrites the user-to-groups associations in the database for a given user.
 * If a user-to-group association already exists, it updates it. Otherwise, it inserts a new association.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string} userId - The ID of the user for whom the associations should be overwritten.
 * @param {string[]} newGroupIds - An array of group IDs and group Label Ids to associate with the user.
 * @returns {Promise<db.UsersToGroups[] | null>} - A promise resolving to an array of the new user-to-groups associations or null if there was an error.
 */
export async function overwriteUsersToGroups(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  newGroupIds: { groupId: string; groupLabelId: string }[],
): Promise<db.UsersToGroups[] | null> {
  try {
    for (const { groupId, groupLabelId } of newGroupIds) {
      const existingEntry = await dbPool.query.usersToGroups.findFirst({
        where: and(
          eq(db.usersToGroups.userId, userId),
          eq(db.usersToGroups.groupLabelId, groupLabelId),
        ),
      });

      if (existingEntry) {
        await dbPool
          .update(db.usersToGroups)
          .set({ userId, groupId, groupLabelId, updatedAt: new Date() })
          .where(
            and(
              eq(db.usersToGroups.userId, userId),
              eq(db.usersToGroups.groupLabelId, groupLabelId),
            ),
          );
      } else {
        await dbPool.insert(db.usersToGroups).values({ userId, groupId, groupLabelId }).returning();
      }
    }

    const newUserGroups = await dbPool.query.usersToGroups.findMany({
      where: eq(db.usersToGroups.userId, userId),
    });
    return newUserGroups;
  } catch (error) {
    console.log('Error upserting user groups: ' + JSON.stringify(error));
    return null;
  }
}
