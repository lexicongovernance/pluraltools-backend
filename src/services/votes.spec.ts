import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as db from '../db';
import { createDbPool } from '../utils/db/createDbPool';
import { runMigrations } from '../utils/db/runMigrations';
import { insertVotesSchema } from '../types';
import { cleanup, seed } from '../utils/db/seed';
import { z } from 'zod';
import { saveVote, getVotesForCycleByUser, updateVoteScore } from './votes';
import { eq } from 'drizzle-orm';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: votes', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;
  let testData: z.infer<typeof insertVotesSchema>;
  let cycle: db.Cycle | undefined;
  let questionOption: db.QuestionOption | undefined;
  let forumQuestion: db.ForumQuestion | undefined;
  let user: db.User | undefined;
  let otherUser: db.User | undefined;
  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    // seed
    const { users, questionOptions, forumQuestions, cycles } = await seed(dbPool);
    // Insert registration fields for the user
    questionOption = questionOptions[0];
    forumQuestion = forumQuestions[0];
    user = users[0];
    otherUser = users[1];
    cycle = cycles[0];
    testData = {
      numOfVotes: 1,
      optionId: questionOption?.id ?? '',
      questionId: forumQuestion?.id ?? '',
      userId: user?.id ?? '',
    };
  });

  test('should save vote', async () => {
    await dbPool.update(db.cycles).set({ status: 'OPEN' }).where(eq(db.cycles.id, cycle!.id));
    // Call the saveVote function
    const { data: response } = await saveVote(dbPool, testData);
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

  test('should not save vote if cycle is closed', async () => {
    // update cycle to closed state
    await dbPool.update(db.cycles).set({ status: 'CLOSED' }).where(eq(db.cycles.id, cycle!.id));
    // Call the saveVote function
    const { data: response, errors } = await saveVote(dbPool, testData);

    // expect response to be undefined
    expect(response).toBeUndefined();

    // expect error message
    expect(errors).toBeDefined();
  });

  test('should not save vote if cycle is upcoming', async () => {
    // update cycle to closed state
    await dbPool.update(db.cycles).set({ status: 'UPCOMING' }).where(eq(db.cycles.id, cycle!.id));
    // Call the saveVote function
    const { data: response, errors } = await saveVote(dbPool, testData);

    // expect response to be undefined
    expect(response).toBeUndefined();

    // expect error message
    expect(errors).toBeDefined();
  });

  test('should get votes latest votes related to user', async function () {
    // create vote in db
    await dbPool.insert(db.votes).values({
      numOfVotes: 2,
      optionId: questionOption!.id,
      questionId: forumQuestion!.id,
      userId: user!.id,
    });
    // create second interaction with option
    await dbPool.insert(db.votes).values({
      numOfVotes: 10,
      optionId: questionOption!.id,
      questionId: forumQuestion!.id,
      userId: user!.id,
    });

    const votes = await getVotesForCycleByUser(dbPool, user!.id, cycle!.id);
    // expect the latest votes
    expect(votes[0]?.numOfVotes).toBe(10);
  });

  test('should not get votes for other user', async function () {
    // create vote in db
    await dbPool.insert(db.votes).values({
      numOfVotes: 2,
      optionId: questionOption!.id,
      questionId: forumQuestion!.id,
      userId: otherUser!.id,
    });
    // create second interaction with option
    await dbPool.insert(db.votes).values({
      numOfVotes: 10,
      optionId: questionOption!.id,
      questionId: forumQuestion!.id,
      userId: otherUser!.id,
    });

    // user 1 gets votes but it should not include otherUser votes
    const votes = await getVotesForCycleByUser(dbPool, user!.id, cycle!.id);

    // no votes have otherUser's id in array
    expect(votes.filter((vote) => vote.userId === otherUser?.id).length).toBe(0);
  });

  test('should calculate multiplier adjusted votes correctly', async () => {
    await dbPool.update(db.cycles).set({ status: 'OPEN' }).where(eq(db.cycles.id, cycle!.id));
    const { voteArray, multiplierArray, voteMultiplierArray, numOfVotesDictionary } =
      await updateVoteScore(dbPool, questionOption?.id ?? '');

    // test voteArray
    expect(voteArray).toBeDefined();
    expect(voteArray).toHaveLength(2);

    voteArray?.forEach((vote) => {
      expect(vote).toHaveProperty('userId');
      expect(vote).toHaveProperty('numOfVotes');
      expect(typeof vote.numOfVotes).toBe('number');
    });

    expect(voteArray[0]?.numOfVotes).toBe(10);
    expect(voteArray[1]?.numOfVotes).toBe(10);

    // test multiplierArray
    expect(multiplierArray).toBeDefined();
    expect(multiplierArray).toHaveLength(2);

    multiplierArray?.forEach((multiplier) => {
      expect(multiplier).toHaveProperty('userId');
      expect(multiplier).toHaveProperty('multiplier');
      expect(typeof multiplier.multiplier).toBe('string');
    });

    expect(multiplierArray[0]?.multiplier).toBe('2');
    expect(multiplierArray[1]?.multiplier).toBe('2');

    // test voteMultiplierArray
    expect(voteMultiplierArray).toBeDefined();
    expect(voteMultiplierArray).toHaveLength(2);

    voteMultiplierArray?.forEach((vote) => {
      expect(vote).toHaveProperty('userId');
      expect(vote).toHaveProperty('numOfVotes');
      expect(vote).toHaveProperty('multiplierVotes');
      expect(typeof vote.multiplierVotes).toBe('number');
    });

    expect(voteMultiplierArray[0]?.numOfVotes).toBe(10);
    expect(voteMultiplierArray[0]?.multiplierVotes).toBe(20);

    // test numOfVotesDictionary
    expect(numOfVotesDictionary).toBeDefined();
    expect(Object.keys(numOfVotesDictionary)).toHaveLength(2);
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
