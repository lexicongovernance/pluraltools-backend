import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { createUsersToGroups, updateUsersToGroups } from './users-to-groups';
import { eq, and } from 'drizzle-orm';
import { createDbPool } from '../utils/db/create-db-pool';
import postgres from 'postgres';
import { runMigrations } from '../utils/db/run-migrations';
import { cleanup, seed } from '../utils/db/seed';
import { randUuid } from '@ngneat/falso';

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
    defaultGroups = groups.filter((group) => group !== undefined) as db.Group[];
    // insert users without group assignment
    await dbPool.insert(db.users).values({ username: 'NewUser', email: 'SomeEmail' });
  });

  test('can save initial groups', async function () {
    // Get the newly inserted user
    const newUser = await dbPool.query.users.findFirst({
      where: eq(db.users.username, 'NewUser'),
    });

    await createUsersToGroups(dbPool, newUser?.id ?? '', defaultGroups[0]?.id ?? '');

    // Find the userToGroup relationship for the newUser and the chosen group
    const newUserGroup = await dbPool.query.usersToGroups.findFirst({
      where: eq(db.usersToGroups.userId, newUser?.id ?? ''),
    });

    expect(newUserGroup).toBeDefined();
    expect(newUserGroup?.userId).toBe(newUser?.id);
  });

  test('can save another group for the same user with a different category id', async function () {
    // Get the newly inserted user
    const newUser = await dbPool.query.users.findFirst({
      where: eq(db.users.username, 'NewUser'),
    });

    await createUsersToGroups(dbPool, newUser?.id ?? '', defaultGroups[2]?.id ?? '');

    // Find the userToGroup relationship for the newUser and the chosen group
    const newUserGroup = await dbPool.query.usersToGroups.findFirst({
      where: and(
        eq(db.usersToGroups.userId, newUser?.id ?? ''),
        eq(db.usersToGroups.groupId, defaultGroups[2]?.id ?? ''),
      ),
    });

    expect(newUserGroup).toBeDefined();
    expect(newUserGroup?.userId).toBe(newUser?.id);
    expect(newUserGroup?.groupId).toBe(defaultGroups[2]?.id);
  });

  test('can update user groups', async function () {
    const newUser = await dbPool.query.users.findFirst({
      where: eq(db.users.username, 'NewUser'),
    });

    const userGroup = await dbPool.query.usersToGroups.findFirst({
      where: eq(db.usersToGroups.userId, newUser?.id ?? ''),
    });

    await updateUsersToGroups({
      dbPool,
      userId: newUser?.id ?? '',
      groupId: defaultGroups[1]?.id ?? '',
      usersToGroupsId: userGroup?.id ?? '',
    });

    // Find the userToGroup relationship for the newUser and the chosen group
    const newUserGroup = await dbPool.query.usersToGroups.findFirst({
      where: and(
        eq(db.usersToGroups.userId, newUser?.id ?? ''),
        eq(db.usersToGroups.groupId, defaultGroups[1]?.id ?? ''),
      ),
    });

    expect(newUserGroup).toBeDefined();
    expect(newUserGroup?.userId).toBe(newUser?.id);
    expect(newUserGroup?.groupId).toBe(defaultGroups[1]?.id);
    expect(newUserGroup?.groupId).not.toBe(defaultGroups[2]?.id);
  });

  test('handles non-existent group IDs', async function () {
    const nonExistentGroupId = randUuid();

    await expect(
      updateUsersToGroups({
        dbPool,
        userId: user?.id ?? '',
        groupId: nonExistentGroupId,
        usersToGroupsId: '',
      }),
    ).rejects.toThrow();
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
