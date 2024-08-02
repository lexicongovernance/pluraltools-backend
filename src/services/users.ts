import * as schema from '../db/schema';
import { and, eq, ne, or } from 'drizzle-orm';
import { UserData, insertUserSchema } from '../types/users';
import { z } from 'zod';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { logger } from '../utils/logger';

/**
 * Checks user data for existing entries in the database.
 */
export async function validateUserData(
  dbPool: NodePgDatabase<typeof schema>,
  userId: string,
  userData: UserData,
) {
  if (userData.email || userData.username) {
    const existingUser = await dbPool
      .select()
      .from(schema.users)
      .where(
        or(
          and(eq(schema.users.email, userData.email ?? ''), ne(schema.users.id, userId)),
          and(eq(schema.users.username, userData.username ?? ''), ne(schema.users.id, userId)),
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
 */
export async function upsertUserData(
  dbPool: NodePgDatabase<typeof schema>,
  userId: string,
  userData: UserData,
) {
  try {
    const user = await dbPool
      .update(schema.users)
      .set({
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        telegram: userData.telegram,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId))
      .returning();

    return user;
  } catch (error) {
    logger.error('Failed to update user data:', error);
  }
}

/**
 * Updates user data in the database.
 */
export async function updateUser(
  dbPool: NodePgDatabase<typeof schema>,
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

  return { data: user };
}
