import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createTestDatabase, seed } from '../db';
import * as schema from '../db/schema';
import { environmentVariables } from '../types';
import { GetCycleById, getCycleVotes } from './cycles';

describe('service: cycles', () => {
  let dbPool: NodePgDatabase<typeof schema>;
  let cycle: schema.Cycle | undefined;
  let questionOption: schema.Option | undefined;
  let forumQuestion: schema.Question | undefined;
  let user: schema.User | undefined;
  let secondUser: schema.User | undefined;
  let deleteTestDatabase: () => Promise<void>;

  before(async () => {
    const envVariables = environmentVariables.parse(process.env);
    const { dbClient, teardown } = await createTestDatabase(envVariables);
    dbPool = dbClient.db;
    deleteTestDatabase = teardown;

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
    await deleteTestDatabase();
  });
});
