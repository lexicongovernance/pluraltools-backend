import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq, and } from 'drizzle-orm';

export async function createUsersToGroups(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  groupId: string,
) {
  const group = await dbPool.query.groups.findFirst({
    where: eq(db.groups.id, groupId),
  });

  if (!group) {
    console.error('Group not found with ID:', groupId);
    throw new Error('Group not found');
  }

  await dbPool
    .insert(db.usersToGroups)
    .values({ userId, groupId, groupCategoryId: group.groupCategoryId })
    .returning();
}

export async function updateUsersToGroups({
  dbPool,
  groupId,
  userId,
  usersToGroupsId,
}: {
  dbPool: PostgresJsDatabase<typeof db>;
  usersToGroupsId: string;
  userId: string;
  groupId: string;
}) {
  const group = await dbPool.query.groups.findFirst({
    where: eq(db.groups.id, groupId),
  });

  if (!group) {
    console.error('Group not found with ID:', groupId);
    throw new Error('Group not found');
  }

  const existingAssociation = await dbPool.query.usersToGroups.findFirst({
    where: and(eq(db.usersToGroups.userId, userId), eq(db.usersToGroups.id, usersToGroupsId)),
  });

  if (!existingAssociation) {
    throw new Error('Users to Groups not found');
  }

  await dbPool
    .update(db.usersToGroups)
    .set({ userId, groupId, groupCategoryId: group.groupCategoryId, updatedAt: new Date() })
    .where(and(eq(db.usersToGroups.userId, userId), eq(db.usersToGroups.id, usersToGroupsId)));
}

export async function deleteUsersToGroups(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  usersToGroupsId: string,
) {
  return await dbPool
    .delete(db.usersToGroups)
    .where(and(eq(db.usersToGroups.userId, userId), eq(db.usersToGroups.id, usersToGroupsId)))
    .returning();
}
