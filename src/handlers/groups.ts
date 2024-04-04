import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
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
