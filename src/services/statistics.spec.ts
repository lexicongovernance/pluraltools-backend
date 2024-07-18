import * as schema from '../db/schema';
import { createDbClient, cleanup, runMigrations, seed } from '../db';
import { environmentVariables, insertVotesSchema } from '../types';
import { z } from 'zod';
import { executeResultQueries } from './statistics';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { describe, before, test, after } from 'node:test';
import assert from 'node:assert/strict';

describe('service: statistics', () => {
  let dbPool: NodePgDatabase<typeof schema>;
  let dbConnection: Client;
  let userTestData: z.infer<typeof insertVotesSchema>;
  let otherUserTestData: z.infer<typeof insertVotesSchema>;
  let questionOption: schema.Option | undefined;
  let forumQuestion: schema.Question | undefined;
  let user: schema.User | undefined;
  let otherUser: schema.User | undefined;

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
    assert.equal(result.numOfGroups, 1, 'Number of groups should be 1');

    // Test option stats
    assert(result.optionStats);
    assert.equal(Object.keys(result.optionStats).length, 2, 'Number of options should be 2');

    for (const optionId in result.optionStats) {
      const optionStat = result.optionStats[optionId];
      assert(optionStat);
      assert(optionStat.title);
      assert(optionStat.subTitle);
      assert(optionStat.pluralityScore);
      assert(optionStat.distinctUsers);
      assert(optionStat.allocatedHearts);
      assert(optionStat.quadraticScore);
      assert(optionStat.distinctGroups);
      assert(optionStat?.listOfGroupNames);

      // Add assertions for distinct users and allocated hearts
      if (optionId === questionOption?.id) {
        // Assuming this option belongs to the user
        assert.equal(optionStat?.distinctUsers, 2);
        assert.equal(optionStat?.allocatedHearts, 8);
        assert.equal(optionStat?.pluralityScore, '4');
        assert.equal(optionStat?.quadraticScore, 16);
        assert.equal(optionStat?.distinctGroups, 1);
        const listOfGroupNames = optionStat?.listOfGroupNames;
        // Check if the array is not empty
        assert(listOfGroupNames);
        assert(listOfGroupNames?.length > 0);
      }
    }
  });

  after(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
