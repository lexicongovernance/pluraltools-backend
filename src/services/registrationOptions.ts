import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq } from 'drizzle-orm';

export async function saveUsersToRegistrationOptions(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  newRegistrationOptions: string[],
): Promise<db.UsersToRegistrationOptions[] | null> {
  // delete all registration options that previously existed for the user
  try {
    await dbPool.delete(db.usersToRegistrationOptions).where(eq(db.usersToRegistrationOptions.userId, userId));
  } catch (e) {
    console.log('error deleting user registration options ' + JSON.stringify(e));
    return null;
  }

  // save the new ones
  const newUserToRegistrationOptions = await dbPool
    .insert(db.usersToRegistrationOptions)
    .values(newRegistrationOptions.map((registrationOptionId) => ({ registrationOptionId, userId })))
    .returning();

  // return new user registration options
  return newUserToRegistrationOptions;
}
