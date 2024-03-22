import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as db from '../db';
import { createDbPool } from '../utils/db/createDbPool';
import { runMigrations } from '../utils/db/runMigrations';
import { insertVotesSchema } from '../types';
import { cleanup, seed } from '../utils/db/seed';
import { z } from 'zod';
import { executeResultQueries } from './statistics';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: statistics', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;
  let userTestData: z.infer<typeof insertVotesSchema>;
  let otherUserTestData: z.infer<typeof insertVotesSchema>;
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
    const { users, questionOptions, forumQuestions } = await seed(dbPool);
    // Insert registration fields for the user
    questionOption = questionOptions[0];
    forumQuestion = forumQuestions[0];
    user = users[0];
    otherUser = users[1];
    userTestData = {
      numOfVotes: 2,
      optionId: questionOption?.id ?? '',
      questionId: forumQuestion?.id ?? '',
      userId: user?.id ?? '',
    };
    otherUserTestData = {
      numOfVotes: 2,
      optionId: questionOption?.id ?? '',
      questionId: forumQuestion?.id ?? '',
      userId: otherUser?.id ?? '',
    };

    // Add additional data to the Db
    await dbPool.insert(db.votes).values(userTestData);
    await dbPool.insert(db.votes).values(otherUserTestData);
  });

  test('should return aggregated statistics when all queries return valid data', async () => {
    const questionId = forumQuestion!.id;

    // Call getResultStatistics with the required parameters
    const result = await executeResultQueries(questionId, dbPool);

    // Test aggregate result statistics
    expect(result).toBeDefined();
    expect(result.numProposals).toEqual(2);
    expect(result.sumNumOfHearts).toEqual(4);
    expect(result.numOfParticipants).toEqual(2);

    // Test option stats
    expect(result.optionStats).toBeDefined();
    expect(Object.keys(result.optionStats)).toHaveLength(2);

    for (const optionId in result.optionStats) {
      const optionStat = result.optionStats[optionId];
      expect(optionStat).toBeDefined();
      expect(optionStat?.optionTitle).toBeDefined();
      expect(optionStat?.optionSubTitle).toBeDefined();
      expect(optionStat?.pluralityScore).toBeDefined();
      expect(optionStat?.distinctUsers).toBeDefined();
      expect(optionStat?.allocatedHearts).toBeDefined();
      expect(optionStat?.distinctGroups).toBeDefined();
      expect(optionStat?.listOfGroupNames).toBeDefined();

      // Add assertions for distinct users and allocated hearts
      if (optionId === questionOption?.id) {
        // Assuming this option belongs to the user
        expect(optionStat?.distinctUsers).toEqual(2);
        expect(optionStat?.allocatedHearts).toEqual(4);
        expect(optionStat?.distinctGroups).toEqual(1);
        const listOfGroupNames = optionStat?.listOfGroupNames;
        // Check if the array is not empty
        expect(listOfGroupNames).toBeDefined();
        expect(listOfGroupNames?.length).toBeGreaterThan(0);
      }
    }
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
