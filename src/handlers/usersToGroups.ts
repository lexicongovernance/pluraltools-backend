import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import { joinGroupsSchema } from '../types/usersToGroups';
import { getSecretGroup } from '../services/groups';
import { upsertUsersToGroups } from '../services/usersToGroups';

export function joinGroupsHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async (req: Request, res: Response) => {
    const userId = req.session.userId;
    const body = joinGroupsSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({ errors: body.error.errors });
    }

    try {
      const secretGroup = await getSecretGroup(dbPool, body.data.secret);

      if (!secretGroup) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const userToGroup = await upsertUsersToGroups(dbPool, userId, [secretGroup.id]);

      return res.json({ data: userToGroup });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'An error occurred while joining the group' });
    }
  };
}
