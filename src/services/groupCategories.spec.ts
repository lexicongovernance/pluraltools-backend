import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as db from '../db';
import { createDbPool } from '../utils/db/createDbPool';
import { runMigrations } from '../utils/db/runMigrations';
import { cleanup, seed } from '../utils/db/seed';
import { canCreateGroupInGroupCategory, canViewGroupsInGroupCategory } from './groupCategories';
import { eq } from 'drizzle-orm';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: groupCategories', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;
  let groupCategory: db.GroupCategory | undefined;

  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
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
        .update(db.groupCategories)
        .set({ userCanCreate: true })
        .where(eq(db.groupCategories.id, groupCategory.id));

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
        .update(db.groupCategories)
        .set({ userCanView: false })
        .where(eq(db.groupCategories.id, groupCategory.id));

      const canView = await canViewGroupsInGroupCategory(dbPool, groupCategory.id);

      expect(canView).toBe(false);
    });
    test('userCanView: true', async function () {
      if (!groupCategory) {
        throw new Error('Group category not found');
      }

      await dbPool
        .update(db.groupCategories)
        .set({ userCanView: true })
        .where(eq(db.groupCategories.id, groupCategory.id));

      const canView = await canViewGroupsInGroupCategory(dbPool, groupCategory.id);

      expect(canView).toBe(true);
    });
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
