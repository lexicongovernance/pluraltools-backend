import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as db from '../db';
import { createDbPool } from '../utils/db/createDbPool';
import { runMigrations } from '../utils/db/runMigrations';
import { insertVotesSchema } from '../types';
import { cleanup, seed } from '../utils/db/seed';
import { z } from 'zod';
import { insertVote } from './votes';
import { eq } from 'drizzle-orm';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: votes', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;
  let testData: z.infer<typeof insertVotesSchema>;
  let cycleId: string;
  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    // seed
    const { users, questionOptions, forumQuestions, cycles } = await seed(dbPool);
    // Insert registration fields for the user
    testData = {
      numOfVotes: 1,
      optionId: questionOptions[0]?.id ?? '',
      questionId: forumQuestions[0]?.id ?? '',
      userId: users[0]?.id ?? '',
    };
    cycleId = cycles[0]?.id ?? '';
  });

  it('should save vote', async () => {
    await dbPool.update(db.cycles).set({ status: 'OPEN' }).where(eq(db.cycles.id, cycleId));
    // Call the saveVote function
    const { data: response } = await insertVote(dbPool, testData);
    // Check if response is defined
    expect(response).toBeDefined();
    // Check property existence and types
    expect(response).toHaveProperty('id');
    expect(response?.id).toEqual(expect.any(String));
    expect(response).toHaveProperty('userId');
    expect(response?.userId).toEqual(expect.any(String));
    // check timestamps
    expect(response?.createdAt).toEqual(expect.any(Date));
    expect(response?.updatedAt).toEqual(expect.any(Date));
  });

  it('should not save vote if cycle is closed', async () => {
    // update cycle to closed state
    await dbPool.update(db.cycles).set({ status: 'CLOSED' }).where(eq(db.cycles.id, cycleId));
    // Call the saveVote function
    const { data: response, errors } = await insertVote(dbPool, testData);

    // expect response to be undefined
    expect(response).toBeUndefined();

    // expect error message
    expect(errors).toBeDefined();
  });

  it('should not save vote if cycle is upcoming', async () => {
    // update cycle to closed state
    await dbPool.update(db.cycles).set({ status: 'UPCOMING' }).where(eq(db.cycles.id, cycleId));
    // Call the saveVote function
    const { data: response, errors } = await insertVote(dbPool, testData);

    // expect response to be undefined
    expect(response).toBeUndefined();

    // expect error message
    expect(errors).toBeDefined();
  });

  afterAll(async () => {
    // Delete registration data
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
