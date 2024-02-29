import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as db from '../db';
import { createDbPool } from '../utils/db/createDbPool';
import { runMigrations } from '../utils/db/runMigrations';
import { insertVotesSchema } from '../types';
import { cleanup, seed } from '../utils/db/seed';
import { z } from 'zod';
import { getResultStatistics } from './resultsPage';
import { eq } from 'drizzle-orm';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('getResultStatistics endpoint', () => {
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

  test('should return aggregated statistics when all queries return valid data', async () => {
    await dbPool.update(db.cycles).set({ status: 'OPEN' }).where(eq(db.cycles.id, cycle!.id));
    // Prepare the request object (if needed based on your function's signature)
    const req = { params: { forumQuestionId: forumQuestion!.id } };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(), // Mock the status function
      json: jest.fn().mockImplementation((data) => {
        return data; // Return the entire data object
      }),
    };

    // Call getResultStatistics with the required parameters
    const result = await getResultStatistics(dbPool)(req as any, res as any);

    // Check if result contains the expected data
    expect(result).toBeDefined();
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
