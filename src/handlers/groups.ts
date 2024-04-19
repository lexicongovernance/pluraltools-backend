import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import { eq } from 'drizzle-orm';
import { insertGroupsSchema } from '../types/groups';
import { canCreateGroupInGroupCategory } from '../services/groupCategories';
import { createSecretGroup } from '../services/groups';
import { upsertUsersToGroups } from '../services/usersToGroups';

export function getGroupRegistrationsHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const groupId = req.params.id;

    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    const registrations = await dbPool.query.registrations.findMany({
      where: eq(db.registrations.groupId, groupId),
    });

    return res.json({ data: registrations });
  };
}

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
      await upsertUsersToGroups(dbPool, userId, [newGroupRows[0].id]);

      return res.json({ data: newGroupRows[0] });
    } catch (error) {
      return res.status(500).json({ error: 'An error occurred while creating the group' });
    }
  };
}
