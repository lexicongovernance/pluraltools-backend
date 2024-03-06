import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as db from '../db';
import { createDbPool } from '../utils/db/createDbPool';
import { runMigrations } from '../utils/db/runMigrations';
import { insertRegistrationSchema } from '../types';
import { cleanup, seed } from '../utils/db/seed';
import { z } from 'zod';
import { upsertRegistrationData, fetchRegistrationFields } from './registrationData';
import { sendRegistrationData } from './registrations';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: registrationData', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;
  let registrationField: db.RegistrationField | undefined;
  let otherRegistrationField: db.RegistrationField | undefined;
  let registration: db.Registration | undefined;
  let testRegistration: z.infer<typeof insertRegistrationSchema>;
  let forumQuestion: db.ForumQuestion | undefined;

  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    // seed
    const { events, users, forumQuestions, registrationFields } = await seed(dbPool);

    // Define data
    forumQuestion = forumQuestions[0];
    registrationField = registrationFields[0];
    otherRegistrationField = registrationFields[1];

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
      ],
    };

    // Add test registration data to the db
    await dbPool.update(db.registrationFields).set({ questionId: forumQuestion?.id ?? '' });
    registration = await sendRegistrationData(dbPool, testRegistration, testRegistration.userId);
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

  test('should fetch registration fields from the database', async () => {
    // Fetch registration fields from the database and call the function
    const registrationFieldIds = [registrationField?.id ?? '', otherRegistrationField?.id ?? ''];
    const result = await fetchRegistrationFields(dbPool, registrationFieldIds);

    // Assert that the result is an array and not empty
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Assert that each item in the result array has the expected properties
    result.forEach((item) => {
      expect(item).toHaveProperty('registrationFieldId');
      expect(item).toHaveProperty('questionId');
      expect(item).toHaveProperty('questionOptionType');
    });
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
