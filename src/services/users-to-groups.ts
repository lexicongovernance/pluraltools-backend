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

  const existingUserToGroup = await dbPool.query.usersToGroups.findFirst({
    where: and(eq(db.usersToGroups.groupId, groupId), eq(db.usersToGroups.userId, userId)),
  });

  if (existingUserToGroup) {
    console.error(userId, 'is already part of group:', groupId);
    throw new Error('User is already part of the group');
  }

  return await dbPool
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

  return await dbPool
    .update(db.usersToGroups)
    .set({ userId, groupId, groupCategoryId: group.groupCategoryId, updatedAt: new Date() })
    .where(and(eq(db.usersToGroups.userId, userId), eq(db.usersToGroups.id, usersToGroupsId)))
    .returning();
}

export async function deleteUsersToGroups(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  usersToGroupsId: string,
) {
  const groupToLeave = await dbPool.query.usersToGroups.findFirst({
    where: eq(db.usersToGroups.id, usersToGroupsId),
  });

  if (!groupToLeave) {
    throw new Error('Users to Groups not found');
  }

  const isGroupLeader = await dbPool.query.registrations.findFirst({
    where: and(
      eq(db.registrations.userId, userId),
      eq(db.registrations.groupId, groupToLeave.groupId),
    ),
  });

  if (isGroupLeader) {
    throw new Error('Leader is not allowed to leave the Group');
  }

  return await dbPool
    .delete(db.usersToGroups)
    .where(and(eq(db.usersToGroups.userId, userId), eq(db.usersToGroups.id, usersToGroupsId)))
    .returning();
}
