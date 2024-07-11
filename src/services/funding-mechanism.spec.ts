import * as db from '../db';
import { createDbClient } from '../utils/db/create-db-connection';
import { runMigrations } from '../utils/db/run-migrations';
import { environmentVariables } from '../types';
import { cleanup, seed } from '../utils/db/seed';
import { calculateFunding } from './funding-mechanism';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

describe('service: funding-mechanism', () => {
  let dbPool: NodePgDatabase<typeof db>;
  let dbConnection: Client;
  let cycle: db.Cycle | undefined;
  let option: db.Option;
  let question: db.Question;

  beforeAll(async () => {
    const envVariables = environmentVariables.parse(process.env);
    const initDb = await createDbClient({
      database: envVariables.DATABASE_NAME,
      host: envVariables.DATABASE_HOST,
      password: envVariables.DATABASE_PASSWORD,
      user: envVariables.DATABASE_USER,
      port: envVariables.DATABASE_PORT,
    });

    await runMigrations({
      database: envVariables.DATABASE_NAME,
      host: envVariables.DATABASE_HOST,
      password: envVariables.DATABASE_PASSWORD,
      user: envVariables.DATABASE_USER,
      port: envVariables.DATABASE_PORT,
    });

    dbPool = initDb.db;
    dbConnection = initDb.client;
    const { cycles, questionOptions, forumQuestions } = await seed(dbPool);
    cycle = cycles[0];
    option = questionOptions[0]!;
    question = forumQuestions[0]!;
  });

  test('calculateFunding returns and error if the query returns no optionData', async () => {
    const response = await calculateFunding(dbPool, '00000000-0000-0000-0000-000000000000');
    expect(response.allocatedFunding).toBeNull();
    expect(response.remainingFunding).toBeNull();
    expect(response.error).toEqual(expect.any(String));
  });

  test('calculateFunding returns the correct funding amount', async () => {
    const response = await calculateFunding(dbPool, question?.id);
    expect(response.allocatedFunding).toBeDefined();
    expect(response.remainingFunding).toEqual(100000);
    expect(response.error).toBeNull();
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
