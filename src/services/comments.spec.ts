import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as db from '../db';
import { createDbPool } from '../utils/db/create-db-pool';
import { runMigrations } from '../utils/db/run-migrations';
import { insertSimpleRegistrationSchema } from '../types';
import { cleanup, seed } from '../utils/db/seed';
import { z } from 'zod';
import { getOptionUsers } from './comments';
import { eq } from 'drizzle-orm';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: comments', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<NonNullable<unknown>>;
  let groupRegistrationData: z.infer<typeof insertSimpleRegistrationSchema>;
  let secretCategory: db.GroupCategory | undefined;
  let questionOption: db.QuestionOption | undefined;
  let secretGroup: db.Group[];
  let cycle: db.Cycle | undefined;
  let forumQuestion: db.ForumQuestion | undefined;
  let user: db.User | undefined;
  let otherUser: db.User | undefined;

  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    // seed
    const { users, questionOptions, forumQuestions, cycles, groups, groupCategories } =
      await seed(dbPool);
    // Insert registration fields for the user
    questionOption = questionOptions[0];
    forumQuestion = forumQuestions[0];
    secretCategory = groupCategories[3];
    user = users[0];
    otherUser = users[1];
    cycle = cycles[0];
    secretGroup = groups.filter((group) => group !== undefined) as db.Group[];
    const secretGroupId = secretGroup[4]?.id ?? '';

    groupRegistrationData = {
      userId: user?.id ?? '',
      eventId: cycle?.eventId ?? '',
      status: 'APPROVED',
      groupId: secretGroupId,
    };

    // Insert group registration data
    await dbPool.insert(db.registrations).values(groupRegistrationData);

    // get registration Id
    const registrationIds = await dbPool
      .select({
        registrationId: db.registrations.id,
      })
      .from(db.registrations);
    const registrationId = registrationIds[0]?.registrationId;

    // update question options
    await dbPool
      .update(db.questionOptions)
      .set({ registrationId: registrationId!, userId: user?.id ?? '' })
      .where(eq(db.questionOptions.id, questionOption!.id));

    // update secret group
    await dbPool.update(db.groups).set({ secret: '12345' }).where(eq(db.groups.id, secretGroupId));

    // insert users to groups
    await dbPool.insert(db.usersToGroups).values({
      userId: user?.id ?? '',
      groupId: secretGroupId,
      groupCategoryId: secretCategory!.id,
    });
    await dbPool.insert(db.usersToGroups).values({
      userId: otherUser?.id ?? '',
      groupId: secretGroupId,
      groupCategoryId: secretCategory!.id,
    });
  });

  test('should return author data when all queries return valid data', async () => {
    const optionId = questionOption!.id;

    // Call getOptionAuthors with the required parameters
    const result = await getOptionUsers(optionId, dbPool);
    expect(result).toBeDefined();
  });

  test('should return null if optionId does not exist', async () => {
    const nonExistentOptionId = '00000000-0000-0000-0000-000000000000';
    const result = await getOptionUsers(nonExistentOptionId, dbPool);
    expect(result).toBeNull();
  });

  afterAll(async () => {
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
