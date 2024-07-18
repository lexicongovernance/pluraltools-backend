import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createTestDatabase, seed } from '../db';
import * as schema from '../db/schema';
import { environmentVariables } from '../types';
import { calculateFunding } from './funding-mechanism';

describe('service: funding-mechanism', () => {
  let dbPool: NodePgDatabase<typeof schema>;
  let question: schema.Question;
  let deleteTestDatabase: () => Promise<void>;

  before(async () => {
    const envVariables = environmentVariables.parse(process.env);
    const { dbClient, teardown } = await createTestDatabase(envVariables);
    dbPool = dbClient.db;
    deleteTestDatabase = teardown;
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
    await deleteTestDatabase();
  });
});
