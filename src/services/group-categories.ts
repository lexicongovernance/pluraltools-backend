import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';

export async function canCreateGroupInGroupCategory(
  dbPool: PostgresJsDatabase<typeof db>,
  groupCategoryId: string,
) {
  const groupCategory = await dbPool.query.groupCategories.findFirst({
    where: (fields, { eq }) => eq(fields.id, groupCategoryId),
  });

  if (!groupCategory) {
    return false;
  }

  return groupCategory.userCanCreate;
}

export async function canViewGroupsInGroupCategory(
  dbPool: PostgresJsDatabase<typeof db>,
  groupCategoryId: string,
) {
  const groupCategory = await dbPool.query.groupCategories.findFirst({
    where: (fields, { eq }) => eq(fields.id, groupCategoryId),
  });

  if (!groupCategory) {
    return false;
  }

  return groupCategory.userCanView;
}
