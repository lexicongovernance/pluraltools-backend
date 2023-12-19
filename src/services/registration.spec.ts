import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq } from 'drizzle-orm';
import { createDbPool } from '../utils/db/createDbPool';
import postgres from 'postgres';
import { runMigrations } from '../utils/db/runMigrations';
import { Request, Response } from 'express';
import { saveRegistration } from './registrations';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('saveRegistration function', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let user: db.User | undefined;
  let dbConnection: postgres.Sql<{}>;
  let testData: {
    userId: string;
    groupIds: string[];
    registrationOptionIds: string[];
  };

  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    user = (await dbPool.insert(db.users).values({}).returning())[0];

    testData = {
      userId: user!.id,
      groupIds: ['groupId1', 'groupId2'],
      registrationOptionIds: ['optionId1', 'optionId2'],
    };
  });

  test('should save registration', async () => {
    // Mock the Express request and response objects
    const req: Request = {
      session: { userId: user?.id },
      body: testData,
    } as Request;

    const res: Response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    // Call the saveRegistration function
    await saveRegistration(dbPool)(req, res);

    // Assert the expected behavior based on the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.any(Object) }));
  });

  afterAll(async () => {
    // delete user
    await dbPool.delete(db.users).where(eq(db.users.id, user?.id ?? ''));
    await dbConnection.end();
  });
});
