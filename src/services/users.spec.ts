import * as schema from '../db/schema';
import { cleanup, createDbClient, runMigrations, seed } from '../db';
import { environmentVariables, insertUserSchema } from '../types';
import { updateUser, upsertUserData, validateUserData } from './users';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { z } from 'zod';

describe('service: users', () => {
  let dbPool: NodePgDatabase<typeof schema>;
  let dbConnection: Client;
  let userData: {
    email: string | null;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    telegram: string | null;
  };
  let user: schema.User;
  let secondUser: schema.User;
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
      expect(transformedUser[key]).not.toBe('');
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
    expect(response).toBeDefined();
    expect(response).toEqual(expect.arrayContaining([expect.any(String)]));
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
    expect(response).toBeDefined();
    expect(response).toEqual(expect.arrayContaining([expect.any(String)]));
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
    expect(response).toBeNull();
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
    expect(response).toBeDefined();
    expect(Array.isArray(response)).toBe(true);
    const updatedUser = response![0];
    expect(updatedUser!.firstName).toBe('Some Name');
    expect(updatedUser!.lastName).toBe('Some Other Name');
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
    expect(response.errors).toBeDefined();
    expect(response.errors![0]).toEqual(expect.any(String));
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
    expect(response.data).toBeDefined();
    expect(response.data![0]!.firstName).toBe('Some Name');
    expect(response.data![0]!.lastName).toBe('Some Other Name');
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
