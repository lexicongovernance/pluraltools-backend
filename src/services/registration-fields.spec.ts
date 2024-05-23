import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { z } from 'zod';
import * as db from '../db';
import { insertRegistrationSchema } from '../types';
import { createDbPool } from '../utils/db/create-db-pool';
import { runMigrations } from '../utils/db/run-migrations';
import { cleanup, seed } from '../utils/db/seed';
import { validateRequiredRegistrationFields } from './registration-fields';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: registrationFields', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;
  let requiredByGroupRegistrationField: db.RegistrationField | undefined;
  let requiredByUserRegistrationField: db.RegistrationField | undefined;
  let testRegistration: z.infer<typeof insertRegistrationSchema>;

  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    // seed
    const { events, users, registrationFields } = await seed(dbPool);

    // required by group
    requiredByGroupRegistrationField = registrationFields[0];
    // required by user
    requiredByUserRegistrationField = registrationFields[1];

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
  });

  describe('should return an empty array if all required fields are filled', function () {
    test('for user', async () => {
      const missingRequiredFields = await validateRequiredRegistrationFields({
        dbPool,
        data: {
          ...testRegistration,
          registrationData: testRegistration.registrationData.filter(
            (data) => data.registrationFieldId !== requiredByGroupRegistrationField?.id,
          ),
        },
        forGroup: false,
        forUser: true,
      });
      expect(missingRequiredFields).toEqual([]);
    });
    test('for group', async () => {
      const missingRequiredFields = await validateRequiredRegistrationFields({
        dbPool,
        data: {
          ...testRegistration,
          registrationData: testRegistration.registrationData.filter(
            (data) => data.registrationFieldId !== requiredByUserRegistrationField?.id,
          ),
        },
        forGroup: true,
        forUser: false,
      });
      expect(missingRequiredFields).toEqual([]);
    });
  });

  describe('should return an array of missing required fields', function () {
    test('for user', async () => {
      const missingRequiredFields = await validateRequiredRegistrationFields({
        dbPool,
        data: {
          ...testRegistration,
          registrationData: testRegistration.registrationData.filter(
            (data) => data.registrationFieldId !== requiredByUserRegistrationField?.id,
          ),
        },
        forGroup: false,
        forUser: true,
      });

      expect(missingRequiredFields).toEqual([
        {
          field: requiredByUserRegistrationField?.name,
          message: 'missing required field',
        },
      ]);
    });
    test('for group', async () => {
      const missingRequiredFields = await validateRequiredRegistrationFields({
        dbPool,
        data: {
          ...testRegistration,
          registrationData: testRegistration.registrationData.filter(
            (data) => data.registrationFieldId !== requiredByGroupRegistrationField?.id,
          ),
        },
        forGroup: true,
        forUser: false,
      });

      expect(missingRequiredFields).toEqual([
        {
          field: requiredByGroupRegistrationField?.name,
          message: 'missing required field',
        },
      ]);
    });
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
