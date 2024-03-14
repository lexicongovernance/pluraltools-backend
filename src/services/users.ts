import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import type { Request, Response } from 'express';
import { and, eq, ne, or } from 'drizzle-orm';
import { UserData, insertUserSchema } from '../types/users';
import { overwriteUsersToGroups } from './usersToGroups';
import { upsertUserAttributes } from './userAttributes';

/**
 * Retrieves user data from the database.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @returns {Function} - Express middleware function to handle the request.
 */
export function getUser(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    try {
      const userId = req.session.userId;
      const user = await dbPool.query.users.findFirst({
        where: eq(db.users.id, userId),
      });

      if (!user) {
        return res.status(401).json({ errors: ['No user found'] });
      }

      return res.json({ data: user });
    } catch (error: unknown) {
      console.error(`[ERROR] ${JSON.stringify(error)}`);
      return res.sendStatus(500);
    }
  };
}

/**
 * Retrieves user attributes from the database.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @returns {Function} - Express middleware function to handle the request.
 */
export function getUserAttributes(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    try {
      const userId = req.session.userId;
      const paramsUserId = req.params.userId;

      if (userId !== paramsUserId) {
        return res.status(400).json({
          errors: [
            {
              message: 'Not authorized to query this user',
            },
          ],
        });
      }

      const userAttributes = await dbPool.query.userAttributes.findMany({
        where: eq(db.userAttributes.userId, userId),
      });

      return res.json({ data: userAttributes });
    } catch (error: unknown) {
      console.error(`[ERROR] ${JSON.stringify(error)}`);
      return res.sendStatus(500);
    }
  };
}

/**
 * Checks user data for existing entries in the database.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string} userId - The ID of the user to check.
 * @param {UserData} userData - The user data to check.
 * @returns {Promise<Array<string> | null>} - An array of errors if user data conflicts, otherwise null.
 */
async function checkUserData(
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
 * @returns {Promise<any>} - A promise resolving to the updated user data.
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
export function updateUser(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const queryUserId = req.params.userId;
    const userId = req.session.userId;

    if (queryUserId !== userId) {
      return res.status(400).json({
        errors: [
          {
            message: 'Not authorized to update this user',
          },
        ],
      });
    }

    const body = insertUserSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({ errors: body.error.errors });
    }

    try {
      const existingUserErrors = await checkUserData(dbPool, userId, body.data);

      if (existingUserErrors) {
        return res.status(400).json({ errors: existingUserErrors });
      }

      const user = await upsertUserData(dbPool, userId, body.data);

      const updatedGroups = await overwriteUsersToGroups(dbPool, userId, body.data.groupIds);

      const updatedUserAttributes = await upsertUserAttributes(
        dbPool,
        userId,
        body.data.userAttributes,
      );

      return res.json({ data: { user, updatedGroups, updatedUserAttributes } });
    } catch (e) {
      console.error(`[ERROR] ${JSON.stringify(e)}`);
      return res.sendStatus(500);
    }
  };
}
