import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import { and, eq } from 'drizzle-orm';
import { canViewGroupsInGroupCategory } from '../services/group-categories';

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
      where: and(eq(db.groupCategories.id, groupCategoryId)),
    });

    return res.json({ data: groupCategory });
  };
}

export function getGroupCategoriesGroupsHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const groupCategoryName = req.params.name;

    if (!groupCategoryName) {
      return res.status(400).json({ error: 'Group Category Name is required' });
    }

    const groupCategory = await dbPool.query.groupCategories.findFirst({
      where: eq(db.groupCategories.name, groupCategoryName),
    });

    if (!groupCategory) {
      return res.status(404).json({ error: 'Group Category not found' });
    }

    const canView = await canViewGroupsInGroupCategory(dbPool, groupCategory.id);

    if (!canView) {
      return res
        .status(403)
        .json({ error: 'You do not have permission to view this group category' });
    }

    const groups = await dbPool.query.groups.findMany({
      where: eq(db.groups.groupCategoryId, groupCategory.id),
      columns: {
        secret: false,
      },
    });

    return res.json({ data: groups });
  };
}
