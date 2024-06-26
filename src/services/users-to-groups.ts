import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as db from '../db';
import { eq, and } from 'drizzle-orm';

export async function createUsersToGroups(
  dbPool: NodePgDatabase<typeof db>,
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
  dbPool: NodePgDatabase<typeof db>;
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
  dbPool: NodePgDatabase<typeof db>,
  userId: string,
  usersToGroupsId: string,
) {
  const groupToLeave = await dbPool.query.usersToGroups.findFirst({
    with: {
      groupCategory: true,
    },
    where: and(eq(db.usersToGroups.userId, userId), eq(db.usersToGroups.id, usersToGroupsId)),
  });

  if (!groupToLeave) {
    throw new Error('Users to Groups not found');
  }

  const userGroups = await dbPool.query.groups.findMany({
    where: eq(db.groups.groupCategoryId, groupToLeave.groupCategoryId!),
  });

  // If the group is required and the user is only in one group, they cannot leave
  if (groupToLeave.groupCategory?.required && userGroups?.length === 1) {
    throw new Error('You are not allowed to leave this group');
  }

  const isRegistrationAttached = await dbPool.query.registrations.findFirst({
    where: and(
      eq(db.registrations.userId, userId),
      eq(db.registrations.groupId, groupToLeave.groupId),
    ),
  });

  if (isRegistrationAttached) {
    throw new Error('Please reassign your proposal to leave this group');
  }

  return await dbPool
    .delete(db.usersToGroups)
    .where(and(eq(db.usersToGroups.userId, userId), eq(db.usersToGroups.id, usersToGroupsId)))
    .returning();
}
