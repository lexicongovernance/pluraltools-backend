import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq } from 'drizzle-orm';

export async function overwriteUsersToGroups(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  newGroupIds: string[],
): Promise<db.UsersToGroups[] | null> {
  // delete all groups that previously existed
  try {
    await dbPool.delete(db.usersToGroups).where(eq(db.usersToGroups.userId, userId));
  } catch (e) {
    console.log('error deleting user groups ' + JSON.stringify(e));
    return null;
  }
  // save the new ones
  const newUsersToGroups = await dbPool
    .insert(db.usersToGroups)
    .values(newGroupIds.map((groupId) => ({ groupId, userId })))
    .returning();

  // return new user groups
  return newUsersToGroups;
}
