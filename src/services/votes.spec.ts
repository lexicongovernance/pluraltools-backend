import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createTestDatabase, seed } from '../db';
import * as schema from '../db/schema';
import { environmentVariables } from '../types';
import {
  calculatePluralScore,
  calculateQuadraticScore,
  groupsDictionary,
  numOfVotesDictionary,
  queryGroupCategories,
  queryVoteData,
  saveVote,
  updateOptionScore,
  updateVoteScoreInDatabase,
  updateVoteScorePlural,
  updateVoteScoreQuadratic,
  userCanVote,
  validateVote,
} from './votes';

describe('service: votes', () => {
  let dbPool: NodePgDatabase<typeof schema>;
  let deleteTestDatabase: () => Promise<void>;
  let testData: { optionId: string; numOfVotes: number };
  let cycle: schema.Cycle | undefined;
  let questionOption: schema.Option | undefined;
  let otherQuestionOption: schema.Option | undefined;
  let forumQuestion: schema.Question | undefined;
  let otherForumQuestion: schema.Question | undefined;
  let groupCategory: schema.GroupCategory | undefined;
  let otherGroupCategory: schema.GroupCategory | undefined;
  let user: schema.User | undefined;
  let secondUser: schema.User | undefined;
  let thirdUser: schema.User | undefined;

  before(async () => {
    const envVariables = environmentVariables.parse(process.env);
    const { dbClient, teardown } = await createTestDatabase(envVariables);
    dbPool = dbClient.db;
    deleteTestDatabase = teardown;
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
    };
  });

  test('validation should return false if no option id is specified', async () => {
    const response = await validateVote(dbPool, { numOfVotes: 1, optionId: '' }, user!.id ?? '');
    assert.equal(response.isValid, false);
    assert(response.error);
  });

  test('validation should return false if a non-existing optionid is specified', async () => {
    const response = await validateVote(
      dbPool,
      { numOfVotes: 1, optionId: '00000000-0000-0000-0000-000000000000' },
      user!.id ?? '',
    );
    assert.equal(response.isValid, false);
    assert(response.error);
  });

  test('validation should return false if the cycle is not open', async () => {
    await dbPool
      .update(schema.cycles)
      .set({ status: 'CLOSED' })
      .where(eq(schema.cycles.id, cycle!.id));
    const response = await validateVote(
      dbPool,
      { numOfVotes: 1, optionId: questionOption?.id ?? '' },
      user!.id ?? '',
    );
    assert.equal(response.isValid, false);
    assert(response.error);
  });

  test('validation should return false if a user is not approved', async () => {
    await dbPool
      .update(schema.cycles)
      .set({ status: 'OPEN' })
      .where(eq(schema.cycles.id, cycle!.id));
    const response = await validateVote(
      dbPool,
      { numOfVotes: 1, optionId: questionOption?.id ?? '' },
      user!.id ?? '',
    );

    assert.equal(response.isValid, false);
    assert(response.error);
  });

  test('validation should return true all validation checks pass', async () => {
    await dbPool.insert(schema.registrations).values({
      status: 'APPROVED',
      userId: user!.id ?? '',
      eventId: cycle!.eventId ?? '',
    });
    const response = await validateVote(
      dbPool,
      { numOfVotes: 1, optionId: questionOption?.id ?? '' },
      user!.id ?? '',
    );

    assert.equal(response.isValid, true);
    assert.equal(response.error, null);
  });

  test('userCanVote returns false if user does not have an approved registration', async () => {
    const response = await userCanVote(dbPool, secondUser!.id ?? '', questionOption?.id ?? '');
    assert.equal(response, false);
  });

  test('userCanVote returns true if user has an approved registration', async () => {
    await dbPool.insert(schema.registrations).values({
      status: 'APPROVED',
      userId: secondUser!.id ?? '',
      eventId: cycle!.eventId ?? '',
    });
    const response = await userCanVote(dbPool, secondUser!.id ?? '', questionOption?.id ?? '');
    assert.equal(response, true);
  });

  test('userCanVote returns false if no option id gets provided', async () => {
    const response = await userCanVote(dbPool, secondUser!.id ?? '', '');
    assert.equal(response, false);
  });

  test('should save vote', async () => {
    const { data: response } = await saveVote(
      dbPool,
      testData,
      user?.id ?? '',
      forumQuestion?.id ?? '',
    );
    assert(response);
    assert(response?.id);
    assert(response?.userId);
    assert(response?.optionId);
    assert(response?.numOfVotes);
    assert(response?.questionId);
    assert(response?.createdAt);
    assert(response?.updatedAt);
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
    assert.equal(response.data, null);
    assert(response.error);
  });

  test('UpdateOptionScore returns an error if not all question ids are the same', async () => {
    const mockData = [
      { optionId: 'option1', numOfVotes: 10 },
      { optionId: 'option2', numOfVotes: 5 },
      { optionId: 'option3', numOfVotes: 2 },
    ];
    const questionIds = [forumQuestion?.id ?? '', otherForumQuestion?.id ?? ''];

    const response = await updateOptionScore(dbPool, mockData, questionIds);
    assert.equal(response.data, null);
    assert(response.errors);
    assert(response.errors[0]);
  });

  test('UpdateOptionScore returns an error if no question id is found', async () => {
    const mockData = [
      { optionId: 'option1', numOfVotes: 10 },
      { optionId: 'option2', numOfVotes: 5 },
      { optionId: 'option3', numOfVotes: 2 },
    ];
    const questionIds = [
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
    ];

    const response = await updateOptionScore(dbPool, mockData, questionIds);
    assert.equal(response.data, null);
    assert(response.errors);
    assert(response.errors[0]);
  });

  test('UpdateOptionScore returns an error if a valid but non existing uuid gets provided', async () => {
    const mockData = [
      { optionId: 'option1', numOfVotes: 10 },
      { optionId: 'option2', numOfVotes: 5 },
      { optionId: 'option3', numOfVotes: 2 },
    ];
    const questionIds = ['', ''];

    const response = await updateOptionScore(dbPool, mockData, questionIds);
    assert.equal(response.data, null);
    assert(response.errors);
    assert(response.errors[0]);
  });

  test('should fetch vote data correctly', async () => {
    // register second user
    await dbPool.insert(schema.registrations).values({
      status: 'APPROVED',
      userId: secondUser!.id ?? '',
      eventId: cycle!.eventId ?? '',
    });
    await saveVote(dbPool, testData, secondUser!.id, forumQuestion?.id ?? '');
    const voteArray = await queryVoteData(dbPool, questionOption?.id ?? '');

    assert(voteArray);
    assert.equal(voteArray.length, 2);

    voteArray?.forEach((vote) => {
      assert(vote);
      assert(vote.userId);
      assert(vote.numOfVotes);
      assert(Number.isInteger(vote.numOfVotes));
    });

    assert.equal(voteArray[0]?.numOfVotes, 1);
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
    assert(result);
    assert.equal(Object.keys(result).length, 2);
    assert.equal(result.user1, 10);
    assert.equal(result.user3, 5);
  });

  test('should include users with zero votes if there are no non-zero votes', () => {
    // Mock voteMultiplierArray with all zero votes
    const voteArray = [
      { userId: 'user1', numOfVotes: 0 },
      { userId: 'user2', numOfVotes: 0 },
    ];

    const result = numOfVotesDictionary(voteArray);
    assert(result);
    assert.equal(Object.keys(result).length, 2);
    assert.equal(result.user1, 0);
    assert.equal(result.user2, 0);
  });

  test('vote dictionary should not contain users voting for another option', async () => {
    // create vote for another question option
    await dbPool.insert(schema.votes).values({
      numOfVotes: 5,
      optionId: otherQuestionOption!.id,
      questionId: forumQuestion!.id,
      userId: thirdUser!.id,
    });

    const voteArray = await queryVoteData(dbPool, questionOption?.id ?? '');
    const result = await numOfVotesDictionary(voteArray);

    assert(user);
    assert(secondUser);
    assert(thirdUser);
    assert.equal(user.id in result, true);
    assert.equal(secondUser.id in result, true);
    assert.equal(thirdUser.id in result, false);
  });

  test('that query group categories returns the correct amount of group category ids', async () => {
    // Get vote data required for groups
    const groupCategoriesIdArray = await queryGroupCategories(dbPool, forumQuestion!.id);
    assert(groupCategoriesIdArray);
    assert(groupCategoriesIdArray.data);
    assert.equal(groupCategoriesIdArray.data.length, 1);
    assert.equal(typeof groupCategoriesIdArray.data[0], 'string');
  });

  test('that query group categories returns an empty array if their are no group categories specified for a specific question', async () => {
    const groupCategoriesIdArray = await queryGroupCategories(dbPool, otherForumQuestion!.id);
    assert(groupCategoriesIdArray);
    assert.equal(groupCategoriesIdArray.data, null);
  });

  test('only return groups for users who voted for the option', async () => {
    const voteArray = await queryVoteData(dbPool, questionOption?.id ?? '');
    const votesDictionary = await numOfVotesDictionary(voteArray);
    const groups = await groupsDictionary(dbPool, votesDictionary, [groupCategory!.id]);

    assert(groups);
    assert(groups['unexpectedKey'] === undefined);
    assert(typeof groups === 'object');
    // check that the groups dictionary only has user ids from the votes dictionary
    for (const key in groups) {
      for (const userId of groups[key]!) {
        assert(userId in votesDictionary, `User ${userId} not in votes dictionary`);
      }
    }
  });

  test('only return groups for users who voted for the option with two elidgible group categories', async () => {
    const voteArray = await queryVoteData(dbPool, questionOption?.id ?? '');
    const votesDictionary = await numOfVotesDictionary(voteArray);
    const groups = await groupsDictionary(dbPool, votesDictionary, [
      groupCategory!.id,
      otherGroupCategory!.id,
    ]);

    assert(groups);
    assert(groups['unexpectedKey'] === undefined);
    assert(typeof groups === 'object');
    assert.equal(Object.keys(groups).length, 2);
    assert.equal(groups[Object.keys(groups)[0]!]!.length, 2);
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
    assert(result);
    assert.equal(typeof result, 'number');
    assert.equal(result, 4.597873224984399);
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
    assert.equal(typeof result, 'number');
    assert.equal(result, 0);
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
    assert(result);
    assert.equal(typeof result, 'number');
    assert.equal(result, 10);
  });

  test('update vote score in database', async () => {
    // update db with dummy score
    const score = 100;
    await updateVoteScoreInDatabase(dbPool, questionOption?.id ?? '', score);

    // query updated db in schema
    const updatedDbScore = await dbPool.query.options.findFirst({
      where: eq(schema.options.id, questionOption?.id ?? ''),
    });

    assert(updatedDbScore);
    assert(updatedDbScore.voteScore);
    assert.equal(updatedDbScore.voteScore, '100');
  });

  test('that the plurality score is correct if both users are in the same group', async () => {
    const score = await updateVoteScorePlural(
      dbPool,
      questionOption?.id ?? '',
      forumQuestion?.id ?? '',
    );
    // sqrt of 2 because the two users are in the same group
    // voting for the same option with 1 vote each
    assert.equal(score, Math.sqrt(2));
  });

  test('that the quadratic score is correctly calculated as the sum of square roots', async () => {
    const score = await updateVoteScoreQuadratic(dbPool, questionOption?.id ?? '');
    // two users voting for the same option with 1 vote each
    // sqrt of 1 + sqrt of 1 = 2
    assert.equal(score, 2);
  });

  after(async () => {
    await deleteTestDatabase();
  });
});
