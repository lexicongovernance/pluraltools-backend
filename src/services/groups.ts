import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';

/**
 * Retrieves groups by a specified group Category ID.
 * @param dbPool The database connection pool.
 * @returns An asynchronous function that handles the HTTP request and response.
 */
export function getGroupsByCategoryId(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const groupCategoryId = req.params.groupCategoryId;
    if (!groupCategoryId) {
      return res.status(400).json({ error: 'groupCategoryId parameter is missing' });
    }
    try {
      const groupByCategoryId = await dbPool.query.groups.findMany({
        where: eq(db.groups.groupCategoryId, groupCategoryId),
      });
      return res.json({ data: groupByCategoryId });
    } catch (e) {
      console.error('error getting groups by Category id ' + JSON.stringify(e));
      return res.status(500).json({ error: 'internal server error' });
    }
  };
}

/**
 * Retrieves groups associated with a specific user filtered by a group Category ID.
 * @param dbPool The database connection pool.
 * @returns An asynchronous function that handles the HTTP request and response.
 */
export function getGroupsPerUserByCategoryId(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const paramsUserId = req.params.userId;
    const userId = req.session.userId;
    const groupCategoryId = req.params.groupCategoryId;

    if (paramsUserId !== userId) {
      return res.status(403).json({ errors: ['forbidden'] });
    }
    if (!groupCategoryId) {
      return res.status(400).json({ error: 'groupCategoryId parameter is missing' });
    }

    try {
      // Fetch all groups associated with the user
      const userGroups = await dbPool.query.usersToGroups.findMany({
        with: {
          group: true,
        },
        where: eq(db.usersToGroups.userId, userId),
      });

      // Filter groups by groupCategoryId
      const groupsWithCategoryId = userGroups.filter(
        (group) => group.group.groupCategoryId === groupCategoryId,
      );

      // Extract the group objects
      const out = groupsWithCategoryId.map((r) => r.group);

      return res.json({ data: out });
    } catch (e) {
      console.log('error getting groups per user by Category id ' + JSON.stringify(e));
      return res.status(500).json({ error: 'internal server error' });
    }
  };
}
