import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq } from 'drizzle-orm';

/**
 * Upserts user-multiplier relationships in the database.
 *
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string} userId - The ID of the user for whom the multiplier is being set.
 * @returns {Promise<db.UsersToMultipliers[] | null>} A promise resolving to an array of user-multiplier objects if successful, otherwise null.
 */
export async function upsertUsersToMultipliers(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
): Promise<db.UsersToMultipliers[] | null> {
  // delete the existing user to multiplier relationship
  try {
    await dbPool.delete(db.usersToMultipliers).where(eq(db.usersToMultipliers.userId, userId));

    const multipliers = await dbPool.query.multipliers.findFirst({
      where: eq(db.multipliers.multiplier, '1.0'),
    });

    // save the new multiplier Id
    const newUserToMultiplier = await dbPool
      .insert(db.usersToMultipliers)
      .values({ userId, multiplierId: multipliers!.id })
      .returning();

    return newUserToMultiplier;
  } catch (e) {
    console.log('error upserting users to multipliers' + JSON.stringify(e));
    return null;
  }
}
