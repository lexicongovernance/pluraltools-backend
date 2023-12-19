import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq } from 'drizzle-orm';
import { createDbPool } from '../utils/db/createDbPool';
import postgres from 'postgres';
import { runMigrations } from '../utils/db/runMigrations';
import { Request, Response } from 'express';
import { saveRegistration } from './registrations';
import { z } from 'zod';
import { insertRegistrationSchema } from '../types';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('saveRegistration function', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let user: db.User | undefined;
  let dbConnection: postgres.Sql<{}>;
  let defaultGroups: db.Group[];
  let testData: z.infer<typeof insertRegistrationSchema>;
  let defaultRegistrations: db.RegistrationOption[];

  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    user = (await dbPool.insert(db.users).values({}).returning())[0];

    // creates initial groups
    defaultGroups = await dbPool
      .insert(db.groups)
      .values([
        {
          name: 'blue',
        },
        {
          name: 'red',
        },
      ])
      .returning();

    // Insert registration options for the user
    const registrationOptions = ['option1', 'option2', 'option3'];
    const dbRegistrationOptions = registrationOptions.map((registrationOptionId) => ({
      name: registrationOptionId,
      category: 'Example Category',
    }));
    defaultRegistrations = await dbPool
      .insert(db.registrationOptions)
      .values(dbRegistrationOptions)
      .returning();

    testData = {
      userId: user!.id,
      proposalTitle: 'some title',
      groupIds: defaultGroups.map((group) => group.id),
      registrationOptionIds: defaultRegistrations.map(
        (registrationOption) => registrationOption.id,
      ),
    };
  });

  test('should save registration', async () => {
    // Mock the Express request and response objects
    const req: Request = {
      session: { userId: user?.id },
      body: testData,
    } as Request;

    // Call the saveRegistration function
    // await saveRegistration(dbPool)(req, res);
    // console.log({ response, res });

    // // Assert the expected behavior based on the response
    // expect(res.status).toHaveBeenCalledWith(200);
    // expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.any(Object) }));
  });

  afterAll(async () => {
    // delete user
    //  await dbPool.delete(db.users).where(eq(db.users.id, user?.id ?? ''));
    await dbConnection.end();
  });
});
