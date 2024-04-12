import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import { and, eq } from 'drizzle-orm';

export function getGroupCategoriesHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const groupCategories = await dbPool.query.groupCategories.findMany();
    return res.json({ data: groupCategories });
  };
}

export function getGroupCategoryHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const groupCategoryName = req.params.name;

    if (!groupCategoryName) {
      return res.status(400).json({ error: 'Group Category Name is required' });
    }

    const groupCategory = await dbPool.query.groupCategories.findFirst({
      with: {
        group: true,
      },
      where: and(eq(db.groupCategories.name, groupCategoryName)),
    });

    return res.json({ data: groupCategory });
  };
}
