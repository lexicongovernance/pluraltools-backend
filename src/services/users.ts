import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { and, eq, ne, or } from 'drizzle-orm';
import { UserData, insertUserSchema } from '../types/users';
import { upsertUsersToGroups } from './usersToGroups';
import { upsertUserAttributes } from './userAttributes';
import { z } from 'zod';

/**
 * Checks user data for existing entries in the database.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string} userId - The ID of the user to check.
 * @param {UserData} userData - The user data to check.
 * @returns {Promise<Array<string> | null>} - An array of errors if user data conflicts, otherwise null.
 */
async function validateUserData(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  userData: UserData,
) {
  if (userData.email || userData.username) {
    const existingUser = await dbPool
      .select()
      .from(db.users)
      .where(
        or(
          and(eq(db.users.email, userData.email ?? ''), ne(db.users.id, userId)),
          and(eq(db.users.username, userData.username ?? ''), ne(db.users.id, userId)),
        ),
      );

    if (existingUser.length > 0) {
      const errors = [];

      if (existingUser[0]?.email && existingUser[0].email === userData.email) {
        errors.push('Email already exists');
      }

      if (existingUser[0]?.username && existingUser[0].username === userData.username) {
        errors.push('Username already exists');
      }

      return errors;
    }
  }

  return null;
}

/**
 * Upserts user data in the database.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string} userId - The ID of the user to update.
 * @param {UserData} userData - The updated user data.
 */
async function upsertUserData(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  userData: UserData,
) {
  try {
    const user = await dbPool
      .update(db.users)
      .set({
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        telegram: userData.telegram,
        updatedAt: new Date(),
      })
      .where(eq(db.users.id, userId))
      .returning();

    return user;
  } catch (error) {
    console.error('Failed to update user data:', error);
  }
}

/**
 * Updates user data in the database.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @returns {Function} - Express middleware function to handle the request.
 */
export async function updateUser(
  dbPool: PostgresJsDatabase<typeof db>,
  data: {
    userId: string;
    userData: z.infer<typeof insertUserSchema>;
  },
) {
  const { userId, userData } = data;

  const existingUserErrors = await validateUserData(dbPool, userId, userData);

  if (existingUserErrors) {
    return { errors: existingUserErrors };
  }

  const user = await upsertUserData(dbPool, userId, userData);

  const updatedGroups = await upsertUsersToGroups(dbPool, userId, userData.groupIds);

  const updatedUserAttributes = await upsertUserAttributes(dbPool, userId, userData.userAttributes);

  return { data: { user, updatedGroups, updatedUserAttributes } };
}
