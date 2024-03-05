import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as db from '../db';
import { createDbPool } from '../utils/db/createDbPool';
import { runMigrations } from '../utils/db/runMigrations';
import { registrationDataSchema } from '../types';
import { insertRegistrationSchema } from '../types';
import { cleanup, seed } from '../utils/db/seed';
import { z } from 'zod';
import { upsertRegistrationData } from './registrationData';
import { sendRegistrationData } from './registrations';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: registrationData', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;
  let registrationTestData: z.infer<typeof registrationDataSchema>;
  let questionOption: db.QuestionOption | undefined;
  let forumQuestion: db.ForumQuestion | undefined;
  let registrationField: db.RegistrationField | undefined;
  let user: db.User | undefined;
  let testRegistration: z.infer<typeof insertRegistrationSchema>;

  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    // seed
    const { events, users, questionOptions, forumQuestions, registrationFields } =
      await seed(dbPool);
    // Insert registration fields for the user
    questionOption = questionOptions[0];
    forumQuestion = forumQuestions[0];
    user = users[0];
    registrationField = registrationFields[0];
    registrationTestData = [
      {
        registrationFieldId: registrationField?.id ?? '',
        value: 'something',
      },
    ];

    testRegistration = {
      userId: users[0]?.id ?? '',
      eventId: events[0]?.id ?? '',
      status: 'DRAFT',
      registrationData: [
        {
          registrationFieldId: registrationFields[0]?.id ?? '',
          value: 'something',
        },
      ],
    };

    // Add test registration data to the db
    await sendRegistrationData(dbPool, testRegistration, testRegistration.userId);
  });

  test('should return aggregated statistics when all queries return valid data', async () => {});

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
