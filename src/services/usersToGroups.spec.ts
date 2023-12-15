import { PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { overwriteUsersToGroups } from './usersToGroups';
import { eq } from 'drizzle-orm';
import { createDbPool } from '../utils/createDbPool';
import postgres from 'postgres';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

// Test create group memberships
describe('service: usersToGroups', function () {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<{}>;
  let user: db.User | undefined;
  let defaultGroups: db.Group[];
  beforeAll(async function () {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    user = (await dbPool.insert(db.users).values({}).returning())[0];

    // creates initial groups
    defaultGroups = await dbPool
      .insert(db.groups)
      .values([
        {
          name: 'blue',
        },
        {
          name: 'red',
        },
      ])
      .returning();
  });

  test('can save initial groups', async function () {
    await overwriteUsersToGroups(dbPool, user?.id ?? '', [defaultGroups[0]?.id ?? '']);
    const group = await dbPool.query.usersToGroups.findFirst({
      where: eq(db.usersToGroups.groupId, defaultGroups[0]?.id ?? ''),
    });
    expect(group?.userId).toBeDefined;
    expect(group?.userId).toBe(user?.id);
  });

  test('can overwrite old groups', async function () {
    await overwriteUsersToGroups(dbPool, user?.id ?? '', [defaultGroups[1]?.id ?? '']);
    const group = await dbPool.query.usersToGroups.findFirst({
      where: eq(db.usersToGroups.groupId, defaultGroups[1]?.id ?? ''),
    });
    expect(group?.userId).toBeDefined;
    expect(group?.userId).toBe(user?.id);
  });

  afterAll(async function () {
    await dbConnection.end();
  });
});
