import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { getResultStatistics } from './resultsPage';
import * as db from '../db';
import postgres from 'postgres';
import { createDbPool } from '../utils/db/createDbPool';
import { runMigrations } from '../utils/db/runMigrations';
import { cleanup, seed } from '../utils/db/seed';
import { Request, Response } from 'express';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('getResultStatistics endpoint', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;

  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;

    // Seed the database
    await seed(dbPool);

    // Initialize req and res objects
    req = {};
    res = {};

    // Initialize dbConnection
    dbConnection = initDb.connection;
  });

  test('should return aggregated statistics when all queries return valid data', async () => {
    // Mock forumQuestionId in req.params
    req.params = { forumQuestionId: '3eac2a7b-a20d-4157-9855-ad7a65a5a731' };

    // Mock res.json and res.status to capture the response
    res.json = jest.fn();
    res.status = jest.fn().mockReturnValue(res);

    // Call getResultStatistics
    await getResultStatistics(dbPool)(req as Request, res as Response);

    // Assertions for response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
