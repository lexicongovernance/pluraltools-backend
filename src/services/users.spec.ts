import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as db from '../db';
import { createDbPool } from '../utils/db/createDbPool';
import { runMigrations } from '../utils/db/runMigrations';
import { getVotesForCycleByUser } from './users';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: users', function () {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<{}>;
  let user: db.User | undefined;
  let otherUser: db.User | undefined;
  let cycle: db.Cycle | undefined;
  let forumQuestion: db.ForumQuestion | undefined;
  let questionOption: db.QuestionOption | undefined;
  let defaultEvent: db.Event;

  beforeAll(async function () {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    user = (await dbPool.insert(db.users).values({}).returning())[0];
    otherUser = (await dbPool.insert(db.users).values({}).returning())[0];
    cycle = (
      await dbPool
        .insert(db.cycles)
        .values({
          eventId: defaultEvent.id,
          startAt: new Date(),
          endAt: new Date(),
        })
        .returning()
    )[0];
    if (!cycle) {
      throw new Error('failed to create cycle');
    }
    forumQuestion = (
      await dbPool
        .insert(db.forumQuestions)
        .values({
          cycleId: cycle.id,
          title: 'test question',
        })
        .returning()
    )[0];
    if (!forumQuestion) {
      throw new Error('failed to create question');
    }
    questionOption = (
      await dbPool
        .insert(db.questionOptions)
        .values({
          questionId: forumQuestion.id,
          text: 'test option',
        })
        .returning()
    )[0];
  });

  test('should get votes latest votes related to user', async function () {
    // create vote in db
    await dbPool.insert(db.votes).values({
      numOfVotes: 2,
      optionId: questionOption!.id,
      userId: user!.id,
    });
    // create second interaction with option
    await dbPool.insert(db.votes).values({
      numOfVotes: 10,
      optionId: questionOption!.id,
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
      userId: otherUser!.id,
    });
    // create second interaction with option
    await dbPool.insert(db.votes).values({
      numOfVotes: 10,
      optionId: questionOption!.id,
      userId: otherUser!.id,
    });

    // user 1 gets votes but it should not include otherUser votes
    const votes = await getVotesForCycleByUser(dbPool, user!.id, cycle!.id);

    // no votes have otherUser's id in array
    expect(votes.filter((vote) => vote.userId === otherUser?.id).length).toBe(0);
  });

  afterAll(async function () {
    // delete votes
    await dbPool.delete(db.votes).where(eq(db.votes.userId, user?.id ?? ''));
    await dbPool.delete(db.votes).where(eq(db.votes.userId, otherUser?.id ?? ''));
    // delete option
    await dbPool
      .delete(db.questionOptions)
      .where(eq(db.questionOptions.id, questionOption?.id ?? ''));
    // delete question
    await dbPool.delete(db.forumQuestions).where(eq(db.forumQuestions.id, forumQuestion?.id ?? ''));
    // delete cycle
    await dbPool.delete(db.cycles).where(eq(db.cycles.id, cycle?.id ?? ''));
    // Delete events
    await dbPool.delete(db.events).where(eq(db.events.id, defaultEvent.id));
    // delete user
    await dbPool.delete(db.users).where(eq(db.users.id, user?.id ?? ''));
    await dbPool.delete(db.users).where(eq(db.users.id, otherUser?.id ?? ''));
    await dbConnection.end();
  });
});
