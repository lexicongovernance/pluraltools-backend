import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { overwriteUsersToGroups } from './usersToGroups';
import { eq, inArray } from 'drizzle-orm';
import { createDbPool } from '../utils/db/createDbPool';
import postgres from 'postgres';
import { runMigrations } from '../utils/db/runMigrations';
import { cleanup, seed } from '../utils/db/seed';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: usersToGroups', function () {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;
  let user: db.User | undefined;
  let defaultGroups: db.Group[];
  beforeAll(async function () {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    // seed
    const { users, groups } = await seed(dbPool);
    user = users[0];
    defaultGroups = groups;
  });

  test('can overwrite old groups', async function () {
    await overwriteUsersToGroups(dbPool, user?.id ?? '', [defaultGroups[1]?.id ?? '']);
    const group = await dbPool.query.usersToGroups.findFirst({
      where: eq(db.usersToGroups.groupId, defaultGroups[1]?.id ?? ''),
    });
    expect(group?.userId).toBeDefined;
    expect(group?.userId).toBe(user?.id);
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
