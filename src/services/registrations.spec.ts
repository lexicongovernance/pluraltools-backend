import * as db from '../db';
import { createDbClient } from '../utils/db/create-db-connection';
import { runMigrations } from '../utils/db/run-migrations';
import { saveRegistration } from './registrations';
import { z } from 'zod';
import { environmentVariables, insertRegistrationSchema } from '../types';
import { cleanup, seed } from '../utils/db/seed';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

describe('service: registrations', () => {
  let dbPool: NodePgDatabase<typeof db>;
  let dbConnection: Client;
  let testData: z.infer<typeof insertRegistrationSchema>;

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
    const { events, registrationFields, users } = await seed(dbPool);
    // Insert registration fields for the user
    testData = {
      userId: users[0]?.id ?? '',
      eventId: events[0]?.id ?? '',
      status: 'DRAFT',
      registrationData: [
        {
          registrationFieldId: registrationFields[0]?.id ?? '',
          value: 'option2',
        },
      ],
    };
  });
  test('send registration data', async function () {
    // Call the saveRegistration function
    const response = await saveRegistration(dbPool, testData);
    // Check if response is defined
    expect(response).toBeDefined();
    // Check property existence and types
    expect(response).toHaveProperty('id');
    expect(response.id).toEqual(expect.any(String));
    expect(response).toHaveProperty('userId');
    expect(response.userId).toEqual(expect.any(String));
    // check registration data
    expect(response.registrationData).toEqual(expect.any(Array));
    expect(response.registrationData).toHaveLength(1);
    // Check array element properties
    response.registrationData!.forEach((data) => {
      expect(data).toHaveProperty('value');
      expect(data).toHaveProperty('registrationFieldId');
    });
    // check timestamps
    expect(response.createdAt).toEqual(expect.any(Date));
    expect(response.updatedAt).toEqual(expect.any(Date));
  });
  test('update registration data', async function () {
    // update testData
    testData.registrationData = [
      {
        registrationFieldId: testData.registrationData[0]?.registrationFieldId ?? '',
        value: 'updated',
      },
    ];
    // Call the saveRegistration function
    const response = await saveRegistration(dbPool, testData);
    // Check if response is defined
    expect(response).toBeDefined();
    // Check property existence and types
    expect(response).toHaveProperty('id');
    expect(response.id).toEqual(expect.any(String));
    expect(response).toHaveProperty('userId');
    expect(response.userId).toEqual(expect.any(String));
    // check registration data
    expect(response.registrationData).toEqual(expect.any(Array));
    expect(response.registrationData).toHaveLength(1);
    // Check array element properties
    response.registrationData!.forEach((data) => {
      expect(data).toHaveProperty('value');
      expect(data).toHaveProperty('registrationFieldId');
    });
    // check timestamps
    expect(response.createdAt).toEqual(expect.any(Date));
    expect(response.updatedAt).toEqual(expect.any(Date));

    // Check if the value was updated
    expect(response.registrationData?.[0]?.value).toEqual('updated');
  });
  afterAll(async () => {
    // Delete registration data
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
