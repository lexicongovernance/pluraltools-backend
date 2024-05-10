import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as db from '../db';
import { createDbPool } from '../utils/db/create-db-pool';
import { runMigrations } from '../utils/db/run-migrations';
import { cleanup, seed } from '../utils/db/seed';
import { createSecretGroup, generateSecret, getSecretGroup, getGroupMembers } from './groups';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

// Define sample wordlist to test the secret generator
const wordlist: string[] = [
  'apple',
  'banana',
  'cherry',
  'date',
  'eggplant',
  'fig',
  'grape',
  'honey',
  'ice',
  'juice',
  'kiwi',
  'lemon',
  'melon',
  'nut',
  'orange',
  'pear',
  'quince',
  'raspberry',
  'strawberry',
  'tomato',
  'umbrella',
  'vanilla',
  'watermelon',
  'xylophone',
  'yogurt',
  'zebra',
];

describe('service: groups', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;
  let group: db.Group[];

  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    const { groups } = await seed(dbPool);
    // Insert registration fields for the user
    group = groups.filter((group) => group !== undefined) as db.Group[];
  });

  test('generate secret:', async function () {
    const secret = generateSecret(wordlist, 3);
    const words = secret.split('-');
    expect(words).toHaveLength(3);
  });

  test('generate multiple secrets:', async function () {
    const secrets = Array.from({ length: 10 }, () => generateSecret(wordlist, 3));

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
    const secret = rows[0]?.secret;
    const words = secret!.split('-');
    expect(words).toHaveLength(3);
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

  test('get group members of a group', async () => {
    const groupId = group[1]?.id ?? '';

    // Call getOptionAuthors with the required parameters
    const result = await getGroupMembers(dbPool, groupId);
    expect(result).toBeDefined();
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
