import * as schema from '../db/schema';
import { createDbClient, cleanup, runMigrations, seed } from '../db';
import { environmentVariables, insertSimpleRegistrationSchema } from '../types';
import { z } from 'zod';
import { getOptionUsers } from './comments';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

describe('service: comments', () => {
  let dbPool: NodePgDatabase<typeof schema>;
  let dbConnection: Client;
  let groupRegistrationData: z.infer<typeof insertSimpleRegistrationSchema>;
  let secretCategory: schema.GroupCategory | undefined;
  let questionOption: schema.Option | undefined;
  let secretGroup: schema.Group[];
  let cycle: schema.Cycle | undefined;
  let user: schema.User | undefined;
  let otherUser: schema.User | undefined;

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
    const { users, questionOptions, cycles, groups, groupCategories } = await seed(dbPool);
    // Insert registration fields for the user
    questionOption = questionOptions[0];
    secretCategory = groupCategories[2];
    user = users[0];
    otherUser = users[1];
    cycle = cycles[0];
    secretGroup = groups.filter((group) => group !== undefined) as schema.Group[];
    const secretGroupId = secretGroup[4]?.id ?? '';

    groupRegistrationData = {
      userId: user?.id ?? '',
      eventId: cycle?.eventId ?? '',
      status: 'APPROVED',
      groupId: secretGroupId,
    };

    // Insert group registration data
    await dbPool.insert(schema.registrations).values(groupRegistrationData);

    // get registration Id
    const registrationIds = await dbPool
      .select({
        registrationId: schema.registrations.id,
      })
      .from(schema.registrations);
    const registrationId = registrationIds[0]?.registrationId;

    // update question options
    await dbPool
      .update(schema.options)
      .set({ registrationId: registrationId!, userId: user?.id ?? '' })
      .where(eq(schema.options.id, questionOption!.id));

    // update secret group
    await dbPool
      .update(schema.groups)
      .set({ secret: '12345' })
      .where(eq(schema.groups.id, secretGroupId));

    // insert users to groups
    await dbPool.insert(schema.usersToGroups).values({
      userId: user?.id ?? '',
      groupId: secretGroupId,
      groupCategoryId: secretCategory!.id,
    });
    await dbPool.insert(schema.usersToGroups).values({
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
