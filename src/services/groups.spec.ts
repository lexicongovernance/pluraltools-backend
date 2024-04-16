import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as db from '../db';
import { createDbPool } from '../utils/db/createDbPool';
import { runMigrations } from '../utils/db/runMigrations';
import { cleanup } from '../utils/db/seed';
import { createSecretGroup, generateSecret, getSecretGroup } from './groups';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: groups', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;

  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
  });

  test('generate secret:', async function () {
    const secret = generateSecret();
    expect(secret).toHaveLength(12);
  });

  test('generate multiple secrets:', async function () {
    const secrets = Array.from({ length: 10 }, () => generateSecret());

    expect(secrets).toHaveLength(10);
    expect(secrets).toEqual(expect.arrayContaining(secrets));
    // none should be the same
    expect(new Set(secrets).size).toBe(secrets.length);
  });

  test('create a group:', async function () {
    const rows = await createSecretGroup(dbPool, {
      name: 'Test Group',
      description: 'Test Description',
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe('Test Group');
    expect(rows[0]?.description).toBe('Test Description');
    // secret should be generated
    expect(rows[0]?.secret).toHaveLength(12);
  });

  test('get a group:', async function () {
    const rows = await createSecretGroup(dbPool, {
      name: 'Test Group',
      description: 'Test Description',
    });

    const group = await getSecretGroup(dbPool, rows[0]?.secret ?? '');

    expect(group?.name).toBe('Test Group');
    expect(group?.description).toBe('Test Description');
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});