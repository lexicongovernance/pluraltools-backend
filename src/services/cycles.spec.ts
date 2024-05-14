import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as db from '../db';
import { createDbPool } from '../utils/db/create-db-pool';
import { runMigrations } from '../utils/db/run-migrations';
import { cleanup, seed } from '../utils/db/seed';
import { GetCycleById, getCycleVotes } from './cycles';
const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: cycles', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;
  let cycle: db.Cycle | undefined;
  let questionOption: db.QuestionOption | undefined;
  let forumQuestion: db.ForumQuestion | undefined;
  let user: db.User | undefined;
  let secondUser: db.User | undefined;

  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
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
    expect(response).toBeDefined();
    expect(response).toHaveProperty('id');
    expect(response.id).toEqual(cycle?.id);
    expect(response).toHaveProperty('status');
    expect(response.status).toEqual(cycle?.status);
    expect(response).toHaveProperty('forumQuestions');
    expect(response.forumQuestions).toEqual(expect.any(Array));
    expect(response.forumQuestions?.[0]?.questionOptions).toEqual(expect.any(Array));
    expect(response).toHaveProperty('createdAt');
    expect(response.createdAt).toEqual(cycle?.createdAt);
    expect(response).toHaveProperty('updatedAt');
    expect(response.updatedAt).toEqual(cycle?.updatedAt);
  });

  test('should get latest votes related to user', async function () {
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

    const votes = await getCycleVotes(dbPool, user!.id, cycle!.id);
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
    const votes = await getCycleVotes(dbPool, user!.id, cycle!.id);

    // no votes have otherUser's id in array
    expect(votes.filter((vote) => vote.userId === secondUser?.id).length).toBe(0);
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
