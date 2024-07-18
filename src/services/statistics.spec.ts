import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { z } from 'zod';
import { createTestDatabase, seed } from '../db';
import * as schema from '../db/schema';
import { environmentVariables, insertVotesSchema } from '../types';
import { executeResultQueries } from './statistics';

describe('service: statistics', () => {
  let dbPool: NodePgDatabase<typeof schema>;
  let userTestData: z.infer<typeof insertVotesSchema>;
  let otherUserTestData: z.infer<typeof insertVotesSchema>;
  let questionOption: schema.Option | undefined;
  let forumQuestion: schema.Question | undefined;
  let user: schema.User | undefined;
  let otherUser: schema.User | undefined;
  let deleteTestDatabase: () => Promise<void>;

  before(async () => {
    const envVariables = environmentVariables.parse(process.env);
    const { dbClient, teardown } = await createTestDatabase(envVariables);
    dbPool = dbClient.db;
    deleteTestDatabase = teardown;

    // seed
    const { users, questionOptions, forumQuestions } = await seed(dbPool);
    // Insert registration fields for the user
    questionOption = questionOptions[0];
    forumQuestion = forumQuestions[0];
    user = users[0];
    otherUser = users[1];
    userTestData = {
      numOfVotes: 4,
      optionId: questionOption?.id ?? '',
      questionId: forumQuestion?.id ?? '',
      userId: user?.id ?? '',
    };
    otherUserTestData = {
      numOfVotes: 4,
      optionId: questionOption?.id ?? '',
      questionId: forumQuestion?.id ?? '',
      userId: otherUser?.id ?? '',
    };

    // Add additional data to the Db
    await dbPool.insert(schema.votes).values(userTestData);
    await dbPool.insert(schema.votes).values(otherUserTestData);
  });

  test('should return aggregated statistics when all queries return valid data', async () => {
    const questionId = forumQuestion!.id;

    // Call getResultStatistics with the required parameters
    const result = await executeResultQueries(questionId, dbPool);

    // Test aggregate result statistics
    assert(result);
    assert.equal(result.numProposals, 2, 'Number of proposals should be 2');
    assert.equal(result.sumNumOfHearts, 8);
    assert.equal(result.numOfParticipants, 2, 'Number of participants should be 2');
    assert.equal(result.numOfGroups, 2, 'Number of groups should be 2');

    // Test option stats
    assert(result.optionStats, 'Option stats should not be empty');
    assert.equal(Object.keys(result.optionStats).length, 2, 'Number of options should be 2');

    for (const optionId in result.optionStats) {
      const optionStat = result.optionStats[optionId];
      assert(optionStat, 'Option stat should not be empty');
      assert(optionStat.title, 'Option title should not be empty');

      // Add assertions for distinct users and allocated hearts
      if (optionId === questionOption?.id) {
        // Assuming this option belongs to the user
        assert.equal(optionStat?.distinctUsers, 2, 'Number of distinct users should be 2');
        assert.equal(optionStat?.allocatedHearts, 8, 'Number of allocated hearts should be 8');
        assert.equal(optionStat?.pluralityScore, '4', 'Plurality score should be 4');
        assert.equal(optionStat?.quadraticScore, 16), 'Quadratic score should be 16';
        assert.equal(optionStat?.distinctGroups, 1, 'Number of distinct groups should be 1');
        const listOfGroupNames = optionStat?.listOfGroupNames;
        // Check if the array is not empty
        assert(listOfGroupNames, 'List of group names should not be empty');
      }
    }
  });

  after(async () => {
    await deleteTestDatabase();
  });
});
