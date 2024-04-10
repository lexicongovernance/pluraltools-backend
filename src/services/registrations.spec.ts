import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { createDbPool } from '../utils/db/createDbPool';
import postgres from 'postgres';
import { runMigrations } from '../utils/db/runMigrations';
import { saveRegistration } from './registrations';
import { z } from 'zod';
import { insertRegistrationSchema } from '../types';
import { cleanup, seed } from '../utils/db/seed';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: registrations', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;
  let testData: z.infer<typeof insertRegistrationSchema>;

  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
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
    const response = await saveRegistration(dbPool, testData, testData.userId);
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
    const response = await saveRegistration(dbPool, testData, testData.userId);
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
