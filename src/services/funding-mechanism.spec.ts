import { cleanup, createDbClient, seed, runMigrations } from '../db';
import * as schema from '../db/schema';
import { environmentVariables } from '../types';
import { calculateFunding } from './funding-mechanism';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { describe, before, test, after } from 'node:test';
import assert from 'node:assert/strict';

describe('service: funding-mechanism', () => {
  let dbPool: NodePgDatabase<typeof schema>;
  let dbConnection: Client;
  let question: schema.Question;

  before(async () => {
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
    const { forumQuestions } = await seed(dbPool);
    question = forumQuestions[0]!;
  });

  test('calculateFunding returns and error if the query returns no optionData', async () => {
    const response = await calculateFunding(dbPool, '00000000-0000-0000-0000-000000000000');
    assert.equal(response.allocatedFunding, null);
    assert.equal(response.remainingFunding, null);
    assert(response.error);
  });

  test('calculateFunding returns the correct funding amount', async () => {
    const response = await calculateFunding(dbPool, question?.id);
    assert(response.allocatedFunding);
    assert.equal(response.remainingFunding, 100000);
    assert.equal(response.error, null);
  });

  after(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
