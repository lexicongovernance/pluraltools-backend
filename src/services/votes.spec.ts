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
  queryVoteData,
  queryGroupCategories,
  numOfVotesDictionary,
  groupsDictionary,
  calculatePluralScore,
  calculateQuadraticScore,
  updateVoteScoreInDatabase,
  updateVoteScore,
  userCanVote,
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
  let otherForumQuestion: db.ForumQuestion | undefined;
  let groupCategory: db.GroupCategory | undefined;
  let otherGroupCategory: db.GroupCategory | undefined;
  let user: db.User | undefined;
  let secondUser: db.User | undefined;
  let thirdUser: db.User | undefined;
  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    // seed
    const { users, questionOptions, forumQuestions, cycles, groupCategories } = await seed(dbPool);
    // Insert registration fields for the user
    questionOption = questionOptions[0];
    otherQuestionOption = questionOptions[1];
    forumQuestion = forumQuestions[0];
    otherForumQuestion = forumQuestions[1];
    groupCategory = groupCategories[0];
    otherGroupCategory = groupCategories[1];
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
    // accept user registration
    await dbPool.insert(db.registrations).values({
      status: 'APPROVED',
      userId: user!.id ?? '',
      eventId: cycle!.eventId ?? '',
    });
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

  test('should not allow voting on users that are not registered', async () => {
    const canVote = await userCanVote(dbPool, secondUser!.id, questionOption!.id);
    expect(canVote).toBe(false);
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

  test('should fetch vote data correctly', async () => {
    // open cycle for voting
    await dbPool.update(db.cycles).set({ status: 'OPEN' }).where(eq(db.cycles.id, cycle!.id));

    // register second user
    await dbPool.insert(db.registrations).values({
      status: 'APPROVED',
      userId: secondUser!.id ?? '',
      eventId: cycle!.eventId ?? '',
    });
    // save a second user vote
    const res = await saveVote(dbPool, { ...testData, userId: secondUser!.id });
    console.log(res);
    const voteArray = await queryVoteData(dbPool, questionOption?.id ?? '');

    expect(voteArray).toBeDefined();
    expect(voteArray).toHaveLength(2);

    voteArray?.forEach((vote) => {
      expect(vote).toHaveProperty('userId');
      expect(vote).toHaveProperty('numOfVotes');
      expect(typeof vote.numOfVotes).toBe('number');
    });

    expect(voteArray[0]?.numOfVotes).toBe(1);
  });

  test('should transform voteArray correctly', () => {
    // Mock voteMultiplierArray
    const voteArray = [
      { userId: 'user1', numOfVotes: 10 },
      { userId: 'user2', numOfVotes: 0 },
      { userId: 'user3', numOfVotes: 5 },
      { userId: 'user4', numOfVotes: 0 },
    ];

    const result = numOfVotesDictionary(voteArray);
    expect(result).toEqual({
      user1: 10,
      user3: 5,
    });
  });

  test('should include users with zero votes if there are no non-zero votes', () => {
    // Mock voteMultiplierArray with all zero votes
    const voteArray = [
      { userId: 'user1', numOfVotes: 0 },
      { userId: 'user2', numOfVotes: 0 },
    ];

    const result = numOfVotesDictionary(voteArray);
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
    const result = await numOfVotesDictionary(voteArray);

    expect(user!.id in result).toBe(true);
    expect(secondUser!.id in result).toBe(true);
    expect(thirdUser!.id in result).toBe(false);
  });

  test('that query group categories returns the correct amount of group category ids', async () => {
    // Get vote data required for groups
    const groupCategoriesIdArray = await queryGroupCategories(dbPool, forumQuestion!.id);
    expect(groupCategoriesIdArray).toBeDefined();
    expect(groupCategoriesIdArray.length).toBe(2);
    expect(Array.isArray(groupCategoriesIdArray)).toBe(true);
    groupCategoriesIdArray.forEach((categoryId) => {
      expect(typeof categoryId).toBe('string');
    });
  });

  test('that query group categories returns an empty array if their are no group categories for a specific question', async () => {
    // Get vote data required for groups
    const groupCategoriesIdArray = await queryGroupCategories(dbPool, otherForumQuestion!.id);
    expect(groupCategoriesIdArray).toBeDefined();
    expect(groupCategoriesIdArray.length).toBe(1);
    expect(Array.isArray(groupCategoriesIdArray)).toBe(true);
    expect(groupCategoriesIdArray).toEqual(['00000000-0000-0000-0000-000000000000']);
  });

  test('only return groups for users who voted for the option', async () => {
    // Get vote data required for groups
    const voteArray = await queryVoteData(dbPool, questionOption?.id ?? '');
    const votesDictionary = await numOfVotesDictionary(voteArray);
    const groups = await groupsDictionary(dbPool, votesDictionary, [groupCategory!.id]);

    expect(groups).toBeDefined();
    expect(groups['unexpectedKey']).toBeUndefined();
    expect(typeof groups).toBe('object');
    expect(Object.keys(groups).length).toEqual(2);
    expect(groups[Object.keys(groups)[0]!]!.length).toEqual(2);
  });

  test('only return baseline groups for users who voted for the option as non of the users is in the additional group category', async () => {
    // Get vote data required for groups
    const voteArray = await queryVoteData(dbPool, questionOption?.id ?? '');
    const votesDictionary = await numOfVotesDictionary(voteArray);
    const groups = await groupsDictionary(dbPool, votesDictionary, [otherGroupCategory!.id]);

    expect(groups).toBeDefined();
    expect(groups['unexpectedKey']).toBeUndefined();
    expect(typeof groups).toBe('object');
    expect(Object.keys(groups).length).toEqual(1);
    expect(groups[Object.keys(groups)[0]!]!.length).toEqual(2);
  });

  test('only return baseline groups when no addtional group category gets provided', async () => {
    // Get vote data required for groups
    const voteArray = await queryVoteData(dbPool, questionOption?.id ?? '');
    const votesDictionary = await numOfVotesDictionary(voteArray);

    const groups = await groupsDictionary(dbPool, votesDictionary, [
      '00000000-0000-0000-0000-000000000000',
    ]);

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
    // Test that the plurality score is correct if both users are in the same group
    const score = await updateVoteScore(dbPool, questionOption?.id ?? '');
    // sqrt of 2 because the two users are in the same group
    // voting for the same option with 1 vote each
    expect(score).toBe(Math.sqrt(2));
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
