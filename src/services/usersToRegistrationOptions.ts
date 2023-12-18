import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq } from 'drizzle-orm';

export async function overWriteUsersToRegistrationOptions(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  newRegistrationOptions: string[],
): Promise<db.UsersToRegistrationOptions[] | null> {
  // delete all registration options that previously existed for the user
  try {
    console.log('Deleting existing records...');
    await dbPool
      .delete(db.usersToRegistrationOptions)
      .where(eq(db.usersToRegistrationOptions.userId, userId));
    console.log('Deletion successful.');
  } catch (e) {
    console.log('error deleting user registration options ' + JSON.stringify(e));
    return null;
  }

  try {
    console.log('Inserting new records...');
    // save the new ones
    const newUserToRegistrationOptions = await dbPool
      .insert(db.usersToRegistrationOptions)
      .values(
        newRegistrationOptions.map((registrationOptionId) => ({ registrationOptionId, userId })),
      )
      .returning();
    console.log('Insertion successful.');
    // return new user registration options
    return newUserToRegistrationOptions;
  } catch (e) {
    console.log('Error inserting new user registration options: ', e);
    return null;
  }
}
