import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as db from '../db';
import { createDbPool } from '../utils/db/createDbPool';
import { runMigrations } from '../utils/db/runMigrations';
import { cleanup, seed } from '../utils/db/seed';
import { GetCycleByIdFromDB } from './cycles';
const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: cycles', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;
  let cycle: db.Cycle | undefined;

  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    // Seed the database
    const { cycles } = await seed(dbPool);
    cycle = cycles[0];
  });

  it('should get cycle by id', async () => {
    const response = await GetCycleByIdFromDB(dbPool, cycle?.id ?? '');
    expect(response).toBeDefined();
    expect(response).toHaveProperty('id');
    expect(response.id).toEqual(cycle?.id);
    expect(response).toHaveProperty('status');
    expect(response.status).toEqual(cycle?.status);
    expect(response).toHaveProperty('forumQuestions');
    expect(response.forumQuestions).toEqual(expect.any(Array));
    expect(response.forumQuestions?.[0]?.questionOptions).toEqual(expect.any(Array));
    expect(response).toHaveProperty('createdAt');
    expect(response.createdAt).toEqual(cycle?.createdAt);
    expect(response).toHaveProperty('updatedAt');
    expect(response.updatedAt).toEqual(cycle?.updatedAt);
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
