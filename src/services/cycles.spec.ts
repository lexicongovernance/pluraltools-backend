import { Client } from 'pg';
import * as schema from '../db/schema';
import { createDbClient, cleanup, runMigrations, seed } from '../db';
import { GetCycleById, getCycleVotes } from './cycles';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { environmentVariables } from '../types';
import { describe, before, test, after } from 'node:test';
import assert from 'node:assert/strict';

describe('service: cycles', () => {
  let dbPool: NodePgDatabase<typeof schema>;
  let dbConnection: Client;
  let cycle: schema.Cycle | undefined;
  let questionOption: schema.Option | undefined;
  let forumQuestion: schema.Question | undefined;
  let user: schema.User | undefined;
  let secondUser: schema.User | undefined;

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
    // Seed the database
    const { cycles, questionOptions, forumQuestions, users } = await seed(dbPool);
    cycle = cycles[0];
    questionOption = questionOptions[0];
    forumQuestion = forumQuestions[0];
    user = users[0];
    secondUser = users[1];
  });

  test('should get cycle by id', async () => {
    const response = await GetCycleById(dbPool, cycle?.id ?? '');
    assert.equal(response.id, cycle?.id);
    assert.equal(response.status, cycle?.status);
    assert(Array.isArray(response.forumQuestions));
    assert(response.forumQuestions[0]);
    assert(Array.isArray(response.forumQuestions[0].questionOptions));
    assert.deepEqual(response.createdAt, cycle?.createdAt);
    assert.deepEqual(response.updatedAt, cycle?.updatedAt);
  });

  test('should get latest votes related to user', async function () {
    // create vote in db
    await dbPool.insert(schema.votes).values({
      numOfVotes: 2,
      optionId: questionOption!.id,
      questionId: forumQuestion!.id,
      userId: user!.id,
    });
    // create second interaction with option
    await dbPool.insert(schema.votes).values({
      numOfVotes: 10,
      optionId: questionOption!.id,
      questionId: forumQuestion!.id,
      userId: user!.id,
    });

    const votes = await getCycleVotes(dbPool, user!.id, cycle!.id);
    // expect the latest votes
    assert.equal(votes[0]?.numOfVotes, 10);
  });

  test('should not get votes for other user', async function () {
    // create vote in schema
    await dbPool.insert(schema.votes).values({
      numOfVotes: 2,
      optionId: questionOption!.id,
      questionId: forumQuestion!.id,
      userId: secondUser!.id,
    });
    // create second interaction with option
    await dbPool.insert(schema.votes).values({
      numOfVotes: 10,
      optionId: questionOption!.id,
      questionId: forumQuestion!.id,
      userId: secondUser!.id,
    });

    // user 1 gets votes but it should not include otherUser votes
    const votes = await getCycleVotes(dbPool, user!.id, cycle!.id);

    // no votes have otherUser's id in array
    assert.equal(votes.filter((vote) => vote.userId === secondUser?.id).length, 0);
  });

  after(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
