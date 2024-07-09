import * as schema from '../db/schema';
import { environmentVariables } from '../types';
import { createDbClient, cleanup, runMigrations, seed } from '../db';
import { canCreateGroupInGroupCategory, canViewGroupsInGroupCategory } from './group-categories';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

describe('service: groupCategories', () => {
  let dbPool: NodePgDatabase<typeof schema>;
  let dbConnection: Client;
  let groupCategory: schema.GroupCategory | undefined;

  beforeAll(async () => {
    const envVariables = environmentVariables.parse(process.env);
    const initDb = await createDbClient({
      database: envVariables.DATABASE_NAME,
      host: envVariables.DATABASE_HOST,
      password: envVariables.DATABASE_PASSWORD,
      user: envVariables.DATABASE_USER,
      port: envVariables.DATABASE_PORT,
    });

    await runMigrations({
      database: envVariables.DATABASE_NAME,
      host: envVariables.DATABASE_HOST,
      password: envVariables.DATABASE_PASSWORD,
      user: envVariables.DATABASE_USER,
      port: envVariables.DATABASE_PORT,
    });

    dbPool = initDb.db;
    dbConnection = initDb.client;
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

      expect(canCreate).toBe(false);
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

      expect(canCreate).toBe(true);
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

      expect(canView).toBe(false);
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

      expect(canView).toBe(true);
    });
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
