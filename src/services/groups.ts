import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';

/**
 * Retrieves all groups from the database.
 * @param dbPool The database connection pool.
 * @returns An asynchronous function that handles the HTTP request and response.
 */
export function getGroups(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const groups = await dbPool.query.groups.findMany();
    return res.json({ data: groups });
  };
}

/**
 * Retrieves groups by a specified group label ID.
 * @param dbPool The database connection pool.
 * @returns An asynchronous function that handles the HTTP request and response.
 */
export function getGroupsByLabelId(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const groupLabelId = req.params.groupLabelId;
    if (!groupLabelId) {
      return res.status(400).json({ error: 'groupLabelId parameter is missing' });
    }
    try {
      const groupByLabelId = await dbPool.query.groups.findMany({
        where: eq(db.groups.groupLabelId, groupLabelId),
      });
      return res.json({ data: groupByLabelId });
    } catch (e) {
      console.error('error getting groups by label id ' + JSON.stringify(e));
      return res.status(500).json({ error: 'internal server error' });
    }
  };
}

/**
 * Retrieves groups associated with a specific user.
 * @param dbPool The database connection pool.
 * @returns An asynchronous function that handles the HTTP request and response.
 */
export function getGroupsPerUser(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const paramsUserId = req.params.userId;
    const userId = req.session.userId;
    if (paramsUserId !== userId) {
      return res.status(403).json({ errors: ['forbidden'] });
    }
    try {
      const query = await dbPool.query.usersToGroups.findMany({
        with: {
          group: true,
        },
        where: eq(db.usersToGroups.userId, userId),
      });
      const out = query.map((r) => r.group);
      return res.json({ data: out });
    } catch (e) {
      console.log('error getting groups per user ' + JSON.stringify(e));
      return res.status(500).json({ error: 'internal server error' });
    }
  };
}

/**
 * Retrieves groups associated with a specific user filtered by a group label ID.
 * @param dbPool The database connection pool.
 * @returns An asynchronous function that handles the HTTP request and response.
 */
export function getGroupsPerUserByLabelId(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const paramsUserId = req.params.userId;
    const userId = req.session.userId;
    const groupLabelId = req.params.groupLabelId;

    if (paramsUserId !== userId) {
      return res.status(403).json({ errors: ['forbidden'] });
    }
    if (!groupLabelId) {
      return res.status(400).json({ error: 'groupLabelId parameter is missing' });
    }

    try {
      // Fetch all groups associated with the user
      const userGroups = await dbPool.query.usersToGroups.findMany({
        with: {
          group: true,
        },
        where: eq(db.usersToGroups.userId, userId),
      });

      // Filter groups by groupLabelId
      const groupsWithLabelId = userGroups.filter(
        (group) => group.group.groupLabelId === groupLabelId,
      );

      // Extract the group objects
      const out = groupsWithLabelId.map((r) => r.group);

      return res.json({ data: out });
    } catch (e) {
      console.log('error getting groups per user by label id ' + JSON.stringify(e));
      return res.status(500).json({ error: 'internal server error' });
    }
  };
}
