import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import {
  joinGroupsSchema,
  leaveGroupsSchema,
  updateUsersToGroupsSchema,
} from '../types/users-to-groups';
import { getSecretGroup } from '../services/groups';
import {
  deleteUsersToGroups,
  createUsersToGroups,
  updateUsersToGroups,
} from '../services/users-to-groups';
import { eq } from 'drizzle-orm';

export function joinGroupsHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async (req: Request, res: Response) => {
    const userId = req.session.userId;
    const body = joinGroupsSchema.safeParse(req.body);

    // does not have secret nor id
    if (!body.success) {
      return res.status(400).json({ errors: body.error.errors });
    }

    try {
      // public group
      if ('groupId' in body.data) {
        const group = await dbPool.query.groups.findFirst({
          where: eq(db.groups.id, body.data.groupId),
        });

        if (!group) {
          return res.status(404).json({ error: 'Group not found' });
        }

        if (group.secret) {
          return res.status(400).json({ error: 'Group is secret' });
        }

        const userToGroup = await createUsersToGroups(dbPool, userId, body.data.groupId);

        return res.json({ data: userToGroup });
      }

      // secret group
      const secretGroup = await getSecretGroup(dbPool, body.data.secret);

      if (!secretGroup) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const userToGroup = await createUsersToGroups(dbPool, userId, secretGroup.id);

      return res.json({ data: userToGroup });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ errors: ['An error occurred while joining the group'] });
    }
  };
}

export function updateGroupsHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const userId = req.session.userId;
    const body = updateUsersToGroupsSchema.safeParse({
      ...req.body,
      userId,
      id: req.params.id,
    });

    if (!body.success) {
      return res.status(400).json({ errors: body.error.errors });
    }

    try {
      const userToGroup = await updateUsersToGroups({
        dbPool,
        groupId: body.data.groupId,
        userId: body.data.userId,
        usersToGroupsId: body.data.id,
      });

      return res.json({ data: userToGroup });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ errors: ['An error occurred while joining the group'] });
    }
  };
}

export function leaveGroupsHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const userId = req.session.userId;
    const id = req.params.id;
    const body = leaveGroupsSchema.safeParse({
      usersToGroupsId: id,
    });

    if (!body.success) {
      return res.status(400).json({ errors: body.error.errors });
    }

    try {
      const deletedUserToGroup = await deleteUsersToGroups(
        dbPool,
        userId,
        body.data.usersToGroupsId,
      );

      return res.json({ data: deletedUserToGroup });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ errors: ['An error occurred while leaving the group'] });
    }
  };
}
