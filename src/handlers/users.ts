import { eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import * as db from '../db';
import { updateUser } from '../services/users';
import { insertUserSchema } from '../types';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Retrieves user data from the database.
 * @param { NodePgDatabase<typeof db>} dbPool - The database connection pool.
 * @returns {Function} - Express middleware function to handle the request.
 */
export function getUserHandler(dbPool: NodePgDatabase<typeof db>) {
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
 * Updates user data in the database.
 * @param { NodePgDatabase<typeof db>} dbPool - The database connection pool.
 * @returns {Function} - Express middleware function to handle the request.
 */
export function updateUserHandler(dbPool: NodePgDatabase<typeof db>) {
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
      const updatedUser = await updateUser(dbPool, {
        userData: body.data,
        userId,
      });

      if (updatedUser.errors && updatedUser.errors.length > 0) {
        return res.status(400).json({ errors: updatedUser.errors });
      }

      if (!updatedUser.data) {
        return res.status(500).json({ errors: ['Failed to update user'] });
      }

      const user = updatedUser.data;

      return res.json({ data: user });
    } catch (e) {
      console.error(`[ERROR] ${JSON.stringify(e)}`);
      return res.sendStatus(500);
    }
  };
}

/**
 * Retrieves groups associated with a specific user.
 * @param dbPool The database connection pool.
 * @returns An asynchronous function that handles the HTTP request and response.
 */
export function getUsersToGroupsHandler(dbPool: NodePgDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const paramsUserId = req.params.userId;
    const userId = req.session.userId;
    if (paramsUserId !== userId) {
      return res.status(403).json({ errors: ['forbidden'] });
    }
    try {
      const query = await dbPool.query.usersToGroups.findMany({
        with: {
          group: {
            with: {
              groupCategory: true,
            },
          },
        },
        where: eq(db.usersToGroups.userId, userId),
      });

      return res.json({ data: query });
    } catch (e) {
      console.log('error getting groups per user ' + JSON.stringify(e));
      return res.status(500).json({ error: 'internal server error' });
    }
  };
}

/**
 * Retrieves user attributes from the database.
 * @param { NodePgDatabase<typeof db>} dbPool - The database connection pool.
 * @returns {Function} - Express middleware function to handle the request.
 */
export function getUserAttributesHandler(dbPool: NodePgDatabase<typeof db>) {
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

export function getUserOptionsHandler(dbPool: NodePgDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
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

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const optionsQuery = await dbPool.query.questionOptions.findMany({
      with: {
        forumQuestion: true,
      },
      where: eq(db.questionOptions.userId, userId),
    });

    return res.json({ data: optionsQuery });
  };
}

export function getUserRegistrationsHandler(dbPool: NodePgDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
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

    try {
      const query = await dbPool
        .select()
        .from(db.registrations)
        .leftJoin(db.events, eq(db.events.id, db.registrations.eventId))
        .where(eq(db.registrations.userId, userId));
      const out = query.map((q) => {
        return {
          ...q.registrations,
          event: q.events,
        };
      });
      return res.json({ data: out });
    } catch (e) {
      console.log('error getting user registrations ' + e);
      return res.sendStatus(500);
    }
  };
}
