import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq, and } from 'drizzle-orm';

/**
 * Overwrites the user-to-groups associations in the database for a given user.
 * If a user-to-group association already exists, it updates it. Otherwise, it inserts a new association.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string} userId - The ID of the user for whom the associations should be overwritten.
 * @param {string[]} newGroupIds - An array to associate with the user.
 * @returns {Promise<db.UsersToGroups[] | null>} - A promise resolving to an array of the new user-to-groups associations or null if there was an error.
 */
export async function overwriteUsersToGroups(
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

      const groupLabelId = group.groupLabelId ?? null;

      if (groupLabelId === null) {
        console.error('Group label ID is null for group with ID:', groupId);
        continue;
      }

      const existingAssociation = await dbPool.query.usersToGroups.findFirst({
        where: and(
          eq(db.usersToGroups.userId, userId),
          eq(db.usersToGroups.groupLabelId, groupLabelId!),
        ),
      });

      if (existingAssociation) {
        await dbPool
          .update(db.usersToGroups)
          .set({ userId, groupId, groupLabelId, updatedAt: new Date() })
          .where(
            and(
              eq(db.usersToGroups.userId, userId),
              eq(db.usersToGroups.groupLabelId, groupLabelId!),
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
    console.error('Error upserting user groups: ' + JSON.stringify(error));
    return null;
  }
}
