import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createTestDatabase, seed } from '../db';
import * as schema from '../db/schema';
import { environmentVariables } from '../types';
import { canCreateGroupInGroupCategory, canViewGroupsInGroupCategory } from './group-categories';

describe('service: groupCategories', () => {
  let dbPool: NodePgDatabase<typeof schema>;
  let groupCategory: schema.GroupCategory | undefined;
  let deleteTestDatabase: () => Promise<void>;

  before(async () => {
    const envVariables = environmentVariables.parse(process.env);
    const { dbClient, teardown } = await createTestDatabase(envVariables);
    dbPool = dbClient.db;
    deleteTestDatabase = teardown;
    // seed
    const { groupCategories } = await seed(dbPool);

    groupCategory = groupCategories[0];
  });

  describe('check if user can create group in category:', function () {
    test('default:', async function () {
      if (!groupCategory) {
        throw new Error('Group category not found');
      }

      const canCreate = await canCreateGroupInGroupCategory(dbPool, groupCategory.id);

      assert.equal(canCreate, false);
    });

    test('userCanCreate: true', async function () {
      if (!groupCategory) {
        throw new Error('Group category not found');
      }

      await dbPool
        .update(schema.groupCategories)
        .set({ userCanCreate: true })
        .where(eq(schema.groupCategories.id, groupCategory.id));

      const canCreate = await canCreateGroupInGroupCategory(dbPool, groupCategory.id);

      assert.equal(canCreate, true);
    });
  });

  describe('check if user can view group category', function () {
    test('userCanView: false', async function () {
      if (!groupCategory) {
        throw new Error('Group category not found');
      }

      await dbPool
        .update(schema.groupCategories)
        .set({ userCanView: false })
        .where(eq(schema.groupCategories.id, groupCategory.id));

      const canView = await canViewGroupsInGroupCategory(dbPool, groupCategory.id);

      assert.equal(canView, false);
    });
    test('userCanView: true', async function () {
      if (!groupCategory) {
        throw new Error('Group category not found');
      }

      await dbPool
        .update(schema.groupCategories)
        .set({ userCanView: true })
        .where(eq(schema.groupCategories.id, groupCategory.id));

      const canView = await canViewGroupsInGroupCategory(dbPool, groupCategory.id);

      assert.equal(canView, true);
    });
  });

  after(async () => {
    await deleteTestDatabase();
  });
});
