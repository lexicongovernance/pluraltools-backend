import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

export async function canCreateGroupInGroupCategory(
  dbPool: NodePgDatabase<typeof schema>,
  groupCategoryId: string,
) {
  const groupCategory = await dbPool.query.groupCategories.findFirst({
    where: eq(schema.groupCategories.id, groupCategoryId),
  });

  if (!groupCategory) {
    return false;
  }

  return groupCategory.userCanCreate;
}

export async function canViewGroupsInGroupCategory(
  dbPool: NodePgDatabase<typeof schema>,
  groupCategoryId: string,
) {
  const groupCategory = await dbPool.query.groupCategories.findFirst({
    where: eq(schema.groupCategories.id, groupCategoryId),
  });

  if (!groupCategory) {
    return false;
  }

  return groupCategory.userCanView;
}
