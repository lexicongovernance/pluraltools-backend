import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as db from '../db';
import { eq } from 'drizzle-orm';

export async function canCreateGroupInGroupCategory(
  dbPool: NodePgDatabase<typeof db>,
  groupCategoryId: string,
) {
  const groupCategory = await dbPool.query.groupCategories.findFirst({
    where: eq(db.groupCategories.id, groupCategoryId),
  });

  if (!groupCategory) {
    return false;
  }

  return groupCategory.userCanCreate;
}

export async function canViewGroupsInGroupCategory(
  dbPool: NodePgDatabase<typeof db>,
  groupCategoryId: string,
) {
  const groupCategory = await dbPool.query.groupCategories.findFirst({
    where: eq(db.groupCategories.id, groupCategoryId),
  });

  if (!groupCategory) {
    return false;
  }

  return groupCategory.userCanView;
}
