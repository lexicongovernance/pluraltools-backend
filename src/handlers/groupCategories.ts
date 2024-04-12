import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import { eq } from 'drizzle-orm';

export function getGroupCategoriesHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const groupCategories = await dbPool.query.groupCategories.findMany();
    return res.json({ data: groupCategories });
  };
}

export function getGroupCategoryHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const groupCategoryId = req.params.id;

    if (!groupCategoryId) {
      return res.status(400).json({ error: 'Group Category ID is required' });
    }

    const groupCategory = await dbPool.query.groupCategories.findFirst({
      where: eq(db.groupCategories.id, groupCategoryId),
    });

    return res.json({ data: groupCategory });
  };
}