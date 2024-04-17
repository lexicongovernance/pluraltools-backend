import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as db from '../db';
import { createDbPool } from '../utils/db/createDbPool';
import { runMigrations } from '../utils/db/runMigrations';
import { insertRegistrationSchema } from '../types';
import { cleanup, seed } from '../utils/db/seed';
import { z } from 'zod';
import { upsertRegistrationData } from './registrationData';
import { saveRegistration } from './registrations';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: registrationData', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;
  let registrationField: db.RegistrationField | undefined;
  let registration: db.Registration | undefined;
  let testRegistration: z.infer<typeof insertRegistrationSchema>;

  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    // seed
    const { events, users, registrationFields } = await seed(dbPool);

    registrationField = registrationFields[0];

    testRegistration = {
      userId: users[0]?.id ?? '',
      eventId: events[0]?.id ?? '',
      status: 'DRAFT',
      registrationData: [
        {
          registrationFieldId: registrationFields[0]?.id ?? '',
          value: 'title',
        },
        {
          registrationFieldId: registrationFields[1]?.id ?? '',
          value: 'sub title',
        },
        {
          registrationFieldId: registrationFields[2]?.id ?? '',
          value: 'other',
        },
      ],
    };

    // Add test registration data to the db
    registration = await saveRegistration(dbPool, testRegistration, testRegistration.userId);
  });

  test('should update existing records', async () => {
    // Call the function with registration ID and registration data to update
    const registrationId = registration?.id ?? '';
    const registrationFieldId = registrationField?.id ?? '';
    const updatedValue = 'updated';

    const registrationTestData = [
      {
        registrationFieldId: registrationFieldId,
        value: updatedValue,
      },
    ];

    const updatedData = await upsertRegistrationData({
      dbPool,
      registrationId: registrationId,
      registrationData: registrationTestData,
    });

    // Assert that the updated data array is not empty
    expect(updatedData).toBeDefined();
    expect(updatedData).not.toBeNull();

    if (updatedData) {
      // Assert that the updated data has the correct structure
      expect(updatedData.length).toBeGreaterThan(0);
      expect(updatedData[0]).toHaveProperty('id');
      expect(updatedData[0]).toHaveProperty('registrationId', registrationId);
      expect(updatedData[0]).toHaveProperty('registrationFieldId', registrationFieldId);
      expect(updatedData[0]).toHaveProperty('value', updatedValue);
      expect(updatedData[0]).toHaveProperty('createdAt');
      expect(updatedData[0]).toHaveProperty('updatedAt');
    }
  });

  test('should return null when an error occurs', async () => {
    // Provide an invalid registration id to trigger the error
    const registrationId = '';
    const registrationFieldId = registrationField?.id ?? '';
    const updatedValue = 'updated';

    const registrationTestData = [
      {
        registrationFieldId: registrationFieldId,
        value: updatedValue,
      },
    ];

    const updatedData = await upsertRegistrationData({
      dbPool,
      registrationId: registrationId,
      registrationData: registrationTestData,
    });

    // Assert that the function returns null when an error occurs
    expect(updatedData).toBeNull();
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
