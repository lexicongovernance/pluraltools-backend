import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import { eq } from 'drizzle-orm';
/**
 * Retrieves all groups from the database.
 * @param dbPool The database connection pool.
 * @returns An asynchronous function that handles the HTTP request and response.
 */
export function getGroupsHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const groups = await dbPool.query.groups.findMany();
    return res.json({ data: groups });
  };
}

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
