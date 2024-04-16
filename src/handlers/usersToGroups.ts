import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import { joinGroupsSchema } from '../types/usersToGroups';
import { getSecretGroup } from '../services/groups';
import { upsertUsersToGroups } from '../services/usersToGroups';
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

        const userToGroup = await upsertUsersToGroups(dbPool, userId, [body.data.groupId]);

        return res.json({ data: userToGroup });
      }

      // secret group
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
