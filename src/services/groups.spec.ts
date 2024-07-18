import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { z } from 'zod';
import { createTestDatabase, seed } from '../db';
import * as schema from '../db/schema';
import { environmentVariables, insertSimpleRegistrationSchema } from '../types';
import {
  createSecretGroup,
  generateSecret,
  getGroupMembers,
  getGroupRegistrations,
  getSecretGroup,
  isUserIsPartOfGroup,
} from './groups';

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
  let dbPool: NodePgDatabase<typeof schema>;
  let group: schema.Group[];
  let groupRegistrationData: z.infer<typeof insertSimpleRegistrationSchema>;
  let secretGroup: schema.Group[];
  let cycle: schema.Cycle | undefined;
  let user: schema.User | undefined;
  let groupCategory: schema.GroupCategory | undefined;
  let deleteTestDatabase: () => Promise<void>;

  before(async () => {
    const envVariables = environmentVariables.parse(process.env);
    const { dbClient, teardown } = await createTestDatabase(envVariables);
    dbPool = dbClient.db;
    deleteTestDatabase = teardown;

    const { users, cycles, groups, groupCategories } = await seed(dbPool);
    group = groups.filter((group) => group !== undefined) as schema.Group[];
    user = users[0];
    cycle = cycles[0];
    groupCategory = groupCategories[0];
    secretGroup = groups.filter((group) => group !== undefined) as schema.Group[];
    const secretGroupId = secretGroup[4]?.id ?? '';

    groupRegistrationData = {
      userId: user?.id ?? '',
      eventId: cycle?.eventId ?? '',
      status: 'APPROVED',
      groupId: secretGroupId,
    };

    // Insert group registration data
    await dbPool.insert(schema.registrations).values(groupRegistrationData);
  });

  test('generate secret:', async function () {
    const secret = generateSecret(wordlist, 3);
    const words = secret.split('-');
    assert.equal(words.length, 3);
  });

  test('generate multiple secrets:', async function () {
    const secrets = Array.from({ length: 10 }, () => generateSecret(wordlist, 3));

    assert.equal(secrets.length, 10);
    assert.equal(secrets.length, new Set(secrets).size);
  });

  test('create a group:', async function () {
    const rows = await createSecretGroup(dbPool, {
      name: 'Test Group',
      description: 'Test Description',
      groupCategoryId: groupCategory!.id,
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.name, 'Test Group');
    assert.equal(rows[0]?.description, 'Test Description');
    // secret should be generated
    const secret = rows[0]?.secret;
    const words = secret!.split('-');
    assert.equal(words.length, 3);
  });

  test('get a group:', async function () {
    const rows = await createSecretGroup(dbPool, {
      name: 'Test Group',
      description: 'Test Description',
      groupCategoryId: groupCategory!.id,
    });

    const group = await getSecretGroup(dbPool, rows[0]?.secret ?? '');

    assert.equal(group?.id, rows[0]?.id);
    assert.equal(group?.name, 'Test Group');
    assert.equal(group?.description, 'Test Description');
  });

  test('get group members of a group', async () => {
    const groupId = group[1]?.id ?? '';
    const result = await getGroupMembers(dbPool, groupId);
    assert(result);
  });

  test('get group registrations', async () => {
    const groupId = group[4]?.id ?? '';
    const result = await getGroupRegistrations(dbPool, groupId);
    assert(result);
  });

  describe('authorization', function () {
    test('when the user is not in the group', async function () {
      const rows = await dbPool
        .insert(schema.groups)
        .values({
          groupCategoryId: groupCategory!.id,
          name: 'Test Group',
        })
        .returning();

      if (!rows) {
        throw new Error('No group found');
      }

      if (!rows[0]) {
        throw new Error('No group found');
      }

      const result = await isUserIsPartOfGroup({
        dbPool,
        userId: user!.id,
        groupId: rows[0].id,
      });

      assert.equal(result, false);
    });
    test('when the user is in the group', async function () {
      const rows = await dbPool
        .insert(schema.groups)
        .values({
          groupCategoryId: groupCategory!.id,
          name: 'Test Group',
        })
        .returning();

      if (!rows) {
        throw new Error('No group found');
      }

      if (!rows[0]) {
        throw new Error('No group found');
      }

      const userGroup = await dbPool
        .insert(schema.usersToGroups)
        .values({
          userId: user!.id,
          groupId: rows[0].id,
        })
        .returning();

      if (!userGroup) {
        throw new Error('No user group found');
      }

      const result = await isUserIsPartOfGroup({
        dbPool,
        userId: user!.id,
        groupId: rows[0].id,
      });

      assert.equal(result, true);
    });
  });

  after(async () => {
    await deleteTestDatabase();
  });
});
