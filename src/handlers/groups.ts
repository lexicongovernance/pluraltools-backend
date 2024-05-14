import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import { insertGroupsSchema } from '../types/groups';
import { canCreateGroupInGroupCategory } from '../services/group-categories';
import { createUsersToGroups } from '../services/users-to-groups';
import { createSecretGroup, getGroupMembers, getGroupRegistrations } from '../services/groups';

export function createGroupHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const userId = req.session.userId;
    const body = insertGroupsSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({ errors: body.error.errors });
    }

    try {
      const canCreateGroup = await canCreateGroupInGroupCategory(
        dbPool,
        body.data.groupCategoryId!,
      );

      if (!canCreateGroup) {
        return res
          .status(403)
          .json({ error: 'You do not have permission to create a group in this category' });
      }

      const newGroupRows = await createSecretGroup(dbPool, body.data);

      if (!newGroupRows || !newGroupRows[0]) {
        return res.status(500).json({ error: 'An error occurred while creating the group' });
      }

      // assign user to new group
      await createUsersToGroups(dbPool, userId, newGroupRows[0].id);

      return res.json({ data: newGroupRows[0] });
    } catch (error) {
      return res.status(500).json({ error: 'An error occurred while creating the group' });
    }
  };
}

/**
 * Retrieves author and co-author data for a given question option created as a secret group.
 *
 * @param {PostgresJsDatabase<typeof db>} dbPool - The PostgreSQL database pool instance.
 * @returns {Function} - An Express middleware function handling the request to retrieve result statistics.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} - A promise that resolves with the Express response containing the author data.
 */
export function getGroupMembersHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    try {
      const groupId = req.params.groupId;

      // Check if groupId is provided
      if (!groupId) {
        return res.status(400).json({ error: 'Missing groupId parameter' });
      }

      // Execute query
      const responseData = await getGroupMembers(dbPool, groupId);

      // Send response
      return res.status(200).json({ data: responseData });
    } catch (error) {
      console.error('Error in getGroupMembers:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

/**
 * Retrieves group registration data of a secret group for a given group Id.
 *
 * @param {PostgresJsDatabase<typeof db>} dbPool - The PostgreSQL database pool instance.
 * @returns {Function} - An Express middleware function handling the request to retrieve result statistics.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<Response>} - A promise that resolves with the Express response containing the registration data.
 */
export function getGroupRegistrationsHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    try {
      const groupId = req.params.groupId;

      // Check if groupId is provided
      if (!groupId) {
        return res.status(400).json({ error: 'Missing groupId parameter' });
      }

      // Execute query
      const responseData = await getGroupRegistrations(dbPool, groupId);

      // Send response
      return res.status(200).json({ data: responseData });
    } catch (error) {
      console.error('Error in getGroupRegistrtions:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
