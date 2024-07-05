import * as db from '../db';
import { createDbClient } from '../utils/db/create-db-connection';
import { runMigrations } from '../utils/db/run-migrations';
import { environmentVariables, insertVotesSchema } from '../types';
import { cleanup, seed } from '../utils/db/seed';
import { z } from 'zod';
import {
  saveVote,
  validateVote,
  queryVoteData,
  queryGroupCategories,
  numOfVotesDictionary,
  groupsDictionary,
  calculatePluralScore,
  calculateQuadraticScore,
  updateVoteScoreInDatabase,
  updateVoteScorePlural,
  updateVoteScoreQuadratic,
  userCanVote,
} from './votes';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

describe('service: votes', () => {
  let dbPool: NodePgDatabase<typeof db>;
  let dbConnection: Client;
  let testData: { optionId: string; numOfVotes: number };
  let cycle: db.Cycle | undefined;
  let questionOption: db.Option | undefined;
  let otherQuestionOption: db.Option | undefined;
  let forumQuestion: db.Question | undefined;
  let otherForumQuestion: db.Question | undefined;
  let groupCategory: db.GroupCategory | undefined;
  let otherGroupCategory: db.GroupCategory | undefined;
  let unrelatedGroupCategory: db.GroupCategory | undefined;
  let user: db.User | undefined;
  let secondUser: db.User | undefined;
  let thirdUser: db.User | undefined;
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
    // seed
    const { users, questionOptions, forumQuestions, cycles, groupCategories } = await seed(dbPool);
    // Insert registration fields for the user
    questionOption = questionOptions[0];
    otherQuestionOption = questionOptions[1];
    forumQuestion = forumQuestions[0];
    otherForumQuestion = forumQuestions[1];
    groupCategory = groupCategories[0];
    otherGroupCategory = groupCategories[1];
    unrelatedGroupCategory = groupCategories[2];
    user = users[0];
    secondUser = users[1];
    thirdUser = users[2];
    cycle = cycles[0];
    testData = {
      numOfVotes: 1,
      optionId: questionOption?.id ?? '',
    };
  });

  test('validation should return false if no option id is specified', async () => {
    const response = await validateVote(dbPool, { numOfVotes: 1, optionId: '' }, user!.id ?? '');
    expect(response.isValid).toEqual(false);
    expect(response.error).toEqual(expect.any(String));
  });

  test('validation should return false if a non-existing optionid is specified', async () => {
    const response = await validateVote(
      dbPool,
      { numOfVotes: 1, optionId: '00000000-0000-0000-0000-000000000000' },
      user!.id ?? '',
    );
    expect(response.isValid).toEqual(false);
    expect(response.error).toEqual(expect.any(String));
  });

  test('validation should return false if the cycle is not open', async () => {
    await dbPool.update(db.cycles).set({ status: 'CLOSED' }).where(eq(db.cycles.id, cycle!.id));
    const response = await validateVote(
      dbPool,
      { numOfVotes: 1, optionId: questionOption?.id ?? '' },
      user!.id ?? '',
    );
    expect(response.isValid).toEqual(false);
    expect(response.error).toEqual(expect.any(String));
  });

  test('validation should return false if a user is not approved', async () => {
    await dbPool.update(db.cycles).set({ status: 'OPEN' }).where(eq(db.cycles.id, cycle!.id));
    const response = await validateVote(
      dbPool,
      { numOfVotes: 1, optionId: questionOption?.id ?? '' },
      user!.id ?? '',
    );
    expect(response.isValid).toEqual(false);
    expect(response.error).toEqual(expect.any(String));
  });

  test('validation should return true all validation checks pass', async () => {
    await dbPool.insert(db.registrations).values({
      status: 'APPROVED',
      userId: user!.id ?? '',
      eventId: cycle!.eventId ?? '',
    });
    const response = await validateVote(
      dbPool,
      { numOfVotes: 1, optionId: questionOption?.id ?? '' },
      user!.id ?? '',
    );
    expect(response.isValid).toEqual(true);
    expect(response.error).toEqual(null);
  });

  test('userCanVote returns false if user does not have an approved registration', async () => {
    const response = await userCanVote(dbPool, secondUser!.id ?? '', questionOption?.id ?? '');
    expect(response).toEqual(false);
  });

  test('userCanVote returns true if user has an approved registration', async () => {
    await dbPool.insert(db.registrations).values({
      status: 'APPROVED',
      userId: secondUser!.id ?? '',
      eventId: cycle!.eventId ?? '',
    });
    const response = await userCanVote(dbPool, secondUser!.id ?? '', questionOption?.id ?? '');
    expect(response).toEqual(true);
  });

  test('userCanVote returns false if no option id gets provided', async () => {
    const response = await userCanVote(dbPool, secondUser!.id ?? '', '');
    expect(response).toEqual(false);
  });

  test('should save vote', async () => {
    const { data: response } = await saveVote(
      dbPool,
      testData,
      user?.id ?? '',
      forumQuestion?.id ?? '',
    );
    expect(response).toBeDefined();
    expect(response).toHaveProperty('id');
    expect(response?.id).toEqual(expect.any(String));
    expect(response).toHaveProperty('userId');
    expect(response?.userId).toEqual(expect.any(String));
    expect(response?.createdAt).toEqual(expect.any(Date));
    expect(response?.updatedAt).toEqual(expect.any(Date));
  });

  test('should not save vote with invalid test data', async () => {
    const invalidTestData = {
      optionId: '',
      numOfVotes: 2,
    };
    const response = await saveVote(
      dbPool,
      invalidTestData,
      user?.id ?? '',
      forumQuestion?.id ?? '',
    );
    expect(response.data).toBeNull();
    expect(response.error).toBeDefined();
    expect(response.error).toEqual(expect.any(String));
  });

  test('should fetch vote data correctly', async () => {
    // register second user
    await dbPool.insert(db.registrations).values({
      status: 'APPROVED',
      userId: secondUser!.id ?? '',
      eventId: cycle!.eventId ?? '',
    });
    await saveVote(dbPool, testData, secondUser!.id, forumQuestion?.id ?? '');
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
    expect(groupCategoriesIdArray.data!.length).toBe(1);
    expect(Array.isArray(groupCategoriesIdArray.data)).toBe(true);
    groupCategoriesIdArray.data!.forEach((categoryId) => {
      expect(typeof categoryId).toBe('string');
    });
  });

  test('that query group categories returns an empty array if their are no group categories specified for a specific question', async () => {
    const groupCategoriesIdArray = await queryGroupCategories(dbPool, otherForumQuestion!.id);
    expect(groupCategoriesIdArray).toBeDefined();
    expect(groupCategoriesIdArray.data!).toBe(null);
  });

  test('only return groups for users who voted for the option', async () => {
    const voteArray = await queryVoteData(dbPool, questionOption?.id ?? '');
    const votesDictionary = await numOfVotesDictionary(voteArray);
    const groups = await groupsDictionary(dbPool, votesDictionary, [groupCategory!.id]);

    expect(groups).toBeDefined();
    expect(groups['unexpectedKey']).toBeUndefined();
    expect(typeof groups).toBe('object');
    expect(Object.keys(groups).length).toEqual(1);
    expect(groups[Object.keys(groups)[0]!]!.length).toEqual(2);
  });

  test('only return groups for users who voted for the option with two elidgible group categories', async () => {
    const voteArray = await queryVoteData(dbPool, questionOption?.id ?? '');
    const votesDictionary = await numOfVotesDictionary(voteArray);
    const groups = await groupsDictionary(dbPool, votesDictionary, [
      groupCategory!.id,
      otherGroupCategory!.id,
    ]);

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
    const groups = await groupsDictionary(dbPool, votesDictionary, [
      groupCategory!.id,
      unrelatedGroupCategory!.id,
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
    const updatedDbScore = await dbPool.query.options.findFirst({
      where: eq(db.options.id, questionOption?.id ?? ''),
    });

    expect(updatedDbScore?.voteScore).toBe('100');
  });

  test('that the plurality score is correct if both users are in the same group', async () => {
    const score = await updateVoteScorePlural(
      dbPool,
      questionOption?.id ?? '',
      forumQuestion?.id ?? '',
    );
    // sqrt of 2 because the two users are in the same group
    // voting for the same option with 1 vote each
    expect(score).toBe(Math.sqrt(2));
  });

  test('that the quadratic score is correctly calculated as the sum of square roots', async () => {
    const score = await updateVoteScoreQuadratic(dbPool, questionOption?.id ?? '');
    // two users voting for the same option with 1 vote each
    // sqrt of 1 + sqrt of 1 = 2
    expect(score).toBe(2);
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
