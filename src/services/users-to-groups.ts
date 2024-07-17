import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger';

export async function createUsersToGroups(
  dbPool: NodePgDatabase<typeof schema>,
  userId: string,
  groupId: string,
) {
  const group = await dbPool.query.groups.findFirst({
    where: eq(schema.groups.id, groupId),
  });

  if (!group) {
    logger.error('Group not found with ID:', groupId);
    throw new Error('Group not found');
  }

  const existingUserToGroup = await dbPool.query.usersToGroups.findFirst({
    where: and(eq(schema.usersToGroups.groupId, groupId), eq(schema.usersToGroups.userId, userId)),
  });

  if (existingUserToGroup) {
    logger.error(userId, 'is already part of group:', groupId);
    throw new Error('User is already part of the group');
  }

  return await dbPool
    .insert(schema.usersToGroups)
    .values({ userId, groupId, groupCategoryId: group.groupCategoryId })
    .returning();
}

export async function updateUsersToGroups({
  dbPool,
  groupId,
  userId,
  usersToGroupsId,
}: {
  dbPool: NodePgDatabase<typeof schema>;
  usersToGroupsId: string;
  userId: string;
  groupId: string;
}) {
  const group = await dbPool.query.groups.findFirst({
    where: eq(schema.groups.id, groupId),
  });

  if (!group) {
    logger.error('Group not found with ID:', groupId);
    throw new Error('Group not found');
  }

  const existingAssociation = await dbPool.query.usersToGroups.findFirst({
    where: and(
      eq(schema.usersToGroups.userId, userId),
      eq(schema.usersToGroups.id, usersToGroupsId),
    ),
  });

  if (!existingAssociation) {
    throw new Error('Users to Groups not found');
  }

  return await dbPool
    .update(schema.usersToGroups)
    .set({ userId, groupId, groupCategoryId: group.groupCategoryId, updatedAt: new Date() })
    .where(
      and(eq(schema.usersToGroups.userId, userId), eq(schema.usersToGroups.id, usersToGroupsId)),
    )
    .returning();
}

export async function deleteUsersToGroups(
  dbPool: NodePgDatabase<typeof schema>,
  userId: string,
  usersToGroupsId: string,
) {
  const groupToLeave = await dbPool.query.usersToGroups.findFirst({
    with: {
      groupCategory: true,
    },
    where: and(
      eq(schema.usersToGroups.userId, userId),
      eq(schema.usersToGroups.id, usersToGroupsId),
    ),
  });

  if (!groupToLeave) {
    throw new Error('Users to Groups not found');
  }

  const userGroups = await dbPool.query.groups.findMany({
    where: eq(schema.groups.groupCategoryId, groupToLeave.groupCategoryId!),
  });

  // If the group is required and the user is only in one group, they cannot leave
  if (groupToLeave.groupCategory?.required && userGroups?.length === 1) {
    throw new Error('You are not allowed to leave this group');
  }

  const isRegistrationAttached = await dbPool.query.registrations.findFirst({
    where: and(
      eq(schema.registrations.userId, userId),
      eq(schema.registrations.groupId, groupToLeave.groupId),
    ),
  });

  if (isRegistrationAttached) {
    throw new Error('Please reassign your proposal to leave this group');
  }

  return await dbPool
    .delete(schema.usersToGroups)
    .where(
      and(eq(schema.usersToGroups.userId, userId), eq(schema.usersToGroups.id, usersToGroupsId)),
    )
    .returning();
}
