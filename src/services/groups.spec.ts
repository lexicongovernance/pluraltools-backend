import * as db from '../db';
import { createDbClient } from '../utils/db/create-db-connection';
import { runMigrations } from '../utils/db/run-migrations';
import { cleanup, seed } from '../utils/db/seed';
import {
  createSecretGroup,
  generateSecret,
  getSecretGroup,
  getGroupMembers,
  getGroupRegistrations,
} from './groups';
import { environmentVariables, insertSimpleRegistrationSchema } from '../types';
import { z } from 'zod';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

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
  let dbPool: NodePgDatabase<typeof db>;
  let dbConnection: Client;
  let group: db.Group[];
  let groupRegistrationData: z.infer<typeof insertSimpleRegistrationSchema>;
  let secretGroup: db.Group[];
  let cycle: db.Cycle | undefined;
  let user: db.User | undefined;
  let groupCategory: db.GroupCategory | undefined;

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

    const { users, cycles, groups, groupCategories } = await seed(dbPool);
    group = groups.filter((group) => group !== undefined) as db.Group[];
    user = users[0];
    cycle = cycles[0];
    groupCategory = groupCategories[0];
    secretGroup = groups.filter((group) => group !== undefined) as db.Group[];
    const secretGroupId = secretGroup[4]?.id ?? '';

    groupRegistrationData = {
      userId: user?.id ?? '',
      eventId: cycle?.eventId ?? '',
      status: 'APPROVED',
      groupId: secretGroupId,
    };

    // Insert group registration data
    await dbPool.insert(db.registrations).values(groupRegistrationData);
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
      groupCategoryId: groupCategory!.id,
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
      groupCategoryId: groupCategory!.id,
    });

    const group = await getSecretGroup(dbPool, rows[0]?.secret ?? '');

    expect(group?.name).toBe('Test Group');
    expect(group?.description).toBe('Test Description');
  });

  test('get group members of a group', async () => {
    const groupId = group[1]?.id ?? '';
    const result = await getGroupMembers(dbPool, groupId);
    expect(result).toBeDefined();
  });

  test('get group registrations', async () => {
    const groupId = group[4]?.id ?? '';
    const result = await getGroupRegistrations(dbPool, groupId);
    expect(result).toBeDefined();
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
