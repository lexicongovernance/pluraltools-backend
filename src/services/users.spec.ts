import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { z } from 'zod';
import { createTestDatabase, seed } from '../db';
import * as schema from '../db/schema';
import { environmentVariables, insertUserSchema } from '../types';
import { updateUser, upsertUserData, validateUserData } from './users';

describe('service: users', () => {
  let dbPool: NodePgDatabase<typeof schema>;
  let userData: {
    email: string | null;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    telegram: string | null;
  };
  let user: schema.User;
  let secondUser: schema.User;
  let deleteTestDatabase: () => Promise<void>;

  before(async () => {
    const envVariables = environmentVariables.parse(process.env);
    const { dbClient, teardown } = await createTestDatabase(envVariables);
    dbPool = dbClient.db;
    deleteTestDatabase = teardown;
    // seed
    const { users } = await seed(dbPool);
    user = users[0]!;
    secondUser = users[1]!;
  });

  test('should remove empty strings from user data', function () {
    const user: z.infer<typeof insertUserSchema> = {
      email: '',
      username: '',
      firstName: '',
      lastName: '',
      telegram: '',
    };

    const transformedUser: { [key: string]: string | null | string[] | object } =
      insertUserSchema.parse(user);

    // Loop through all keys and check if they are not empty strings
    for (const key of Object.keys(transformedUser)) {
      assert.notStrictEqual(transformedUser[key], '');
    }
  });

  test('validateUserData returns an error if email already exists', async () => {
    userData = {
      email: secondUser?.email ?? null,
      username: user?.username ?? null,
      firstName: user?.firstName ?? null,
      lastName: user?.lastName ?? null,
      telegram: user?.telegram ?? null,
    };

    const response = await validateUserData(dbPool, user?.id, userData);
    assert(response !== null);
    assert(response?.length > 0);
    assert(response?.[0] !== null);
  });

  test('validateUserData returns an error if username already exists', async () => {
    userData = {
      email: user?.email ?? null,
      username: secondUser?.username ?? null,
      firstName: user?.firstName ?? null,
      lastName: user?.lastName ?? null,
      telegram: user?.telegram ?? null,
    };

    const response = await validateUserData(dbPool, user?.id, userData);
    assert(response !== null);
    assert(response?.length > 0);
    assert(response?.[0] !== null);
  });

  test('validateUserData returns null if validation is successful', async () => {
    userData = {
      email: user?.email ?? null,
      username: user?.username ?? null,
      firstName: 'Some Name' ?? null,
      lastName: 'Some Other Name' ?? null,
      telegram: user?.telegram ?? null,
    };

    const response = await validateUserData(dbPool, user?.id, userData);
    assert(response === null);
  });

  test('upsertUserData returns updated user data if insertion is successful', async () => {
    userData = {
      email: user?.email ?? null,
      username: user?.username ?? null,
      firstName: 'Some Name' ?? null,
      lastName: 'Some Other Name' ?? null,
      telegram: user?.telegram ?? null,
    };

    const response = await upsertUserData(dbPool, user?.id, userData);
    assert(response);
    assert(Array.isArray(response));
    assert(response.length > 0);
    assert(response[0] !== null);
    const updatedUser = response[0];
    assert.equal(updatedUser!.firstName, 'Some Name');
    assert.equal(updatedUser!.lastName, 'Some Other Name');
  });

  test('updateUser returns the respective error if validation fails', async () => {
    userData = {
      email: user?.email ?? null,
      username: secondUser?.username ?? null,
      firstName: user?.firstName ?? null,
      lastName: user?.lastName ?? null,
      telegram: user?.telegram ?? null,
    };
    const mockData = {
      userId: user?.id,
      userData: userData,
    };

    const response = await updateUser(dbPool, mockData);
    assert(response.errors);
    assert(response.errors?.length > 0);
    assert(response.errors![0] !== null);
  });

  test('updateUser returns user data if validation and insertion succeeds', async () => {
    userData = {
      email: user?.email ?? null,
      username: user?.username ?? null,
      firstName: 'Some Name' ?? null,
      lastName: 'Some Other Name' ?? null,
      telegram: user?.telegram ?? null,
    };
    const mockData = {
      userId: user?.id,
      userData: userData,
    };

    const response = await updateUser(dbPool, mockData);
    assert(response.data);
    assert(response.data?.length > 0);
    assert(response.data![0] !== null);
    assert.equal(response.data![0]!.id, user?.id);
    assert.equal(response.data![0]!.email, user?.email);
  });

  after(async () => {
    await deleteTestDatabase();
  });
});
