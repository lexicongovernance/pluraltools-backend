import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as db from '../db';
import { createDbPool } from '../utils/db/createDbPool';
import { runMigrations } from '../utils/db/runMigrations';
import { insertVotesSchema } from '../types';
import { cleanup, seed } from '../utils/db/seed';
import { z } from 'zod';
import {
  saveVote,
  getVotesForCycleByUser,
  queryVoteData,
  queryMultiplierData,
  voteMultiplierArray,
  numOfVotesDictionary,
  groupsDictionary,
  calculatePluralScore,
  calculateQuadraticScore,
  updateVoteScoreInDatabase,
  updateVoteScore,
} from './votes';
import { eq } from 'drizzle-orm';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: votes', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;
  let testData: z.infer<typeof insertVotesSchema>;
  let cycle: db.Cycle | undefined;
  let questionOption: db.QuestionOption | undefined;
  let otherQuestionOption: db.QuestionOption | undefined;
  let forumQuestion: db.ForumQuestion | undefined;
  let user: db.User | undefined;
  let secondUser: db.User | undefined;
  let thirdUser: db.User | undefined;
  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    // seed
    const { users, questionOptions, forumQuestions, cycles } = await seed(dbPool);
    // Insert registration fields for the user
    questionOption = questionOptions[0];
    otherQuestionOption = questionOptions[1];
    forumQuestion = forumQuestions[0];
    user = users[0];
    secondUser = users[1];
    thirdUser = users[2];
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
      userId: secondUser!.id,
    });
    // create second interaction with option
    await dbPool.insert(db.votes).values({
      numOfVotes: 10,
      optionId: questionOption!.id,
      questionId: forumQuestion!.id,
      userId: secondUser!.id,
    });

    // user 1 gets votes but it should not include otherUser votes
    const votes = await getVotesForCycleByUser(dbPool, user!.id, cycle!.id);

    // no votes have otherUser's id in array
    expect(votes.filter((vote) => vote.userId === secondUser?.id).length).toBe(0);
  });

  test('should fetch vote data correctly', async () => {
    const voteArray = await queryVoteData(dbPool, questionOption?.id ?? '');

    expect(voteArray).toBeDefined();
    expect(voteArray).toHaveLength(2);

    voteArray?.forEach((vote) => {
      expect(vote).toHaveProperty('userId');
      expect(vote).toHaveProperty('numOfVotes');
      expect(typeof vote.numOfVotes).toBe('number');
    });

    expect(voteArray[0]?.numOfVotes).toBe(10);
    expect(voteArray[1]?.numOfVotes).toBe(10);
  });

  test('should fetch multiplier data correctly', async () => {
    const multiplierArray = await queryMultiplierData(dbPool);

    expect(multiplierArray).toBeDefined();
    expect(multiplierArray).toHaveLength(3);

    multiplierArray?.forEach((multiplier) => {
      expect(multiplier).toHaveProperty('userId');
      expect(multiplier).toHaveProperty('multiplier');
      expect(typeof multiplier.multiplier).toBe('string');
    });

    expect(multiplierArray[0]?.multiplier).toBe('2');
    expect(multiplierArray[1]?.multiplier).toBe('2');
  });

  test('should combine vote and multiplier data correctly', () => {
    // Mock vote array
    const voteArray = [
      { userId: 'user1', numOfVotes: 10 },
      { userId: 'user2', numOfVotes: 15 },
    ];

    // Mock multiplier array
    const multiplierArray = [
      { userId: 'user1', multiplier: '2' },
      { userId: 'user2', multiplier: '1' },
    ];

    const result = voteMultiplierArray(voteArray, multiplierArray);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ userId: 'user1', numOfVotes: 10, multiplierVotes: 20 });
    expect(result[1]).toEqual({ userId: 'user2', numOfVotes: 15, multiplierVotes: 15 });
  });

  test('should filter and transform voteMultiplierArray correctly', () => {
    // Mock voteMultiplierArray
    const voteMultiplierArray = [
      { userId: 'user1', numOfVotes: 10, multiplierVotes: 20 },
      { userId: 'user2', numOfVotes: 0, multiplierVotes: 0 },
      { userId: 'user3', numOfVotes: 5, multiplierVotes: 5 },
      { userId: 'user4', numOfVotes: 0, multiplierVotes: 0 },
    ];

    const result = numOfVotesDictionary(voteMultiplierArray);
    expect(result).toEqual({
      user1: 20,
      user3: 5,
    });
  });

  test('should include users with zero votes if there are no non-zero votes', () => {
    // Mock voteMultiplierArray with all zero votes
    const voteMultiplierArray = [
      { userId: 'user1', numOfVotes: 0, multiplierVotes: 0 },
      { userId: 'user2', numOfVotes: 0, multiplierVotes: 0 },
    ];

    const result = numOfVotesDictionary(voteMultiplierArray);
    expect(result).toEqual({
      user1: 0,
      user2: 0,
    });
  });

  test('vote dictionary should not contain users voting for another option', async () => {
    // create vote for another question option
    await dbPool.insert(db.votes).values({
      numOfVotes: 5,
      optionId: otherQuestionOption!.id,
      questionId: forumQuestion!.id,
      userId: thirdUser!.id,
    });

    const voteArray = await queryVoteData(dbPool, questionOption?.id ?? '');
    const multiplierArray = await queryMultiplierData(dbPool);
    const getVoteMultiplierArray = await voteMultiplierArray(voteArray, multiplierArray);
    const result = await numOfVotesDictionary(getVoteMultiplierArray);

    expect(user!.id in result).toBe(true);
    expect(secondUser!.id in result).toBe(true);
    expect(thirdUser!.id in result).toBe(false);
  });

  test('only return groups for users who voted for the option', async () => {
    // Get vote data required for groups
    const voteArray = await queryVoteData(dbPool, questionOption?.id ?? '');
    const multiplierArray = await queryMultiplierData(dbPool);
    const getVoteMultiplierArray = await voteMultiplierArray(voteArray, multiplierArray);
    const votesDictionary = await numOfVotesDictionary(getVoteMultiplierArray);
    const groups = await groupsDictionary(dbPool, votesDictionary);

    expect(groups).toBeDefined();
    expect(groups['unexpectedKey']).toBeUndefined();
    expect(typeof groups).toBe('object');
    expect(Object.keys(groups).length).toEqual(1);
    expect(groups[Object.keys(groups)[0]!]!.length).toEqual(2);
  });

  test('should calculate the plural score correctly', () => {
    // Mock groups dictionary
    const groupsDictionary = {
      group0: ['user0', 'user1'],
      group1: ['user1', 'user2', 'user3'],
      group2: ['user0', 'user2'],
    };

    // Mock number of votes dictionary
    const numOfVotesDictionary = {
      user0: 1,
      user1: 2,
      user2: 3,
      user3: 4,
    };

    const result = calculatePluralScore(groupsDictionary, numOfVotesDictionary);
    expect(result).toBe(4.597873224984399);
  });

  test('plural score should be 0 when every user vote is zero', () => {
    // Mock groups dictionary
    const groupsDictionary = {
      group0: ['user0', 'user1'],
      group1: ['user1', 'user2', 'user3'],
      group2: ['user0', 'user2'],
    };

    // Mock number of votes dictionary
    const numOfVotesDictionary = {
      user0: 0,
      user1: 0,
      user2: 0,
      user3: 0,
    };

    const result = calculatePluralScore(groupsDictionary, numOfVotesDictionary);
    expect(result).toBe(0);
  });

  test('test quadratic score calculation', () => {
    // Mock number of votes dictionary
    const numOfVotesDictionary = {
      user0: 4,
      user1: 4,
      user2: 9,
      user3: 9,
    };

    const result = calculateQuadraticScore(numOfVotesDictionary);
    expect(result).toBe(10);
  });

  test('update vote score in database', async () => {
    // update db with dummy score
    const score = 100;
    await updateVoteScoreInDatabase(dbPool, questionOption?.id ?? '', score);

    // query updated score in db
    const updatedDbScore = await dbPool.query.questionOptions.findFirst({
      where: eq(db.questionOptions.id, questionOption?.id ?? ''),
    });

    expect(updatedDbScore?.voteScore).toBe('100');
  });

  test('full integration test of the update vote functionality', async () => {
    // Get vote data required for groups
    const score = await updateVoteScore(dbPool, questionOption?.id ?? '');
    expect(score).toBe(Math.sqrt(40));
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
