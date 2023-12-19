import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq, inArray } from 'drizzle-orm';
import { createDbPool } from '../utils/db/createDbPool';
import postgres from 'postgres';
import { runMigrations } from '../utils/db/runMigrations';
import { sendRegistrationData } from './registrations';
import { z } from 'zod';
import { insertRegistrationSchema } from '../types';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('sendRegistrationData  function', () => {
  let dbPool: PostgresJsDatabase<typeof db>;
  let user: db.User | undefined;
  let dbConnection: postgres.Sql<{}>;
  let defaultGroups: db.Group[];
  let testData: z.infer<typeof insertRegistrationSchema>;
  let defaultRegistrations: db.RegistrationOption[];

  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    user = (await dbPool.insert(db.users).values({}).returning())[0];

    // creates initial groups
    defaultGroups = await dbPool
      .insert(db.groups)
      .values([
        {
          name: 'blue',
        },
        {
          name: 'red',
        },
      ])
      .returning();

    // Insert registration options for the user
    const registrationOptions = ['option1', 'option2', 'option3'];
    const dbRegistrationOptions = registrationOptions.map((registrationOptionId) => ({
      name: registrationOptionId,
      category: 'Example Category',
    }));
    defaultRegistrations = await dbPool
      .insert(db.registrationOptions)
      .values(dbRegistrationOptions)
      .returning();

    testData = {
      userId: user!.id,
      proposalTitle: 'some title',
      groupIds: defaultGroups.map((group) => group.id),
      registrationOptionIds: defaultRegistrations.map(
        (registrationOption) => registrationOption.id,
      ),
    };
  });

  test('send registration data', async () => {
    // Call the saveRegistration function
    const response = await sendRegistrationData(dbPool, testData, user?.id || '');

    // Check if response is defined
    expect(response).toBeDefined();

    // Check property existence and types
    expect(response).toHaveProperty('id');
    expect(response.id).toEqual(expect.any(String));
    expect(response).toHaveProperty('userId');
    expect(response.userId).toEqual(expect.any(String));

    // Check array length
    expect(response.groups).toEqual(expect.any(Array));
    expect(response.groups).toHaveLength(2); // Assuming 2 groups in the example
    expect(response.registrationOptions).toEqual(expect.any(Array));
    expect(response.registrationOptions).toHaveLength(3); // Assuming 3 registration options in the example

    // Check array element properties
    response.groups!.forEach((group) => {
      expect(group).toHaveProperty('id');
      expect(group).toHaveProperty('userId');
    });

    response.registrationOptions!.forEach((option: any) => {
      expect(option).toHaveProperty('id');
      expect(option).toHaveProperty('userId');
    });

    // check timestamps
    expect(response.createdAt).toEqual(expect.any(Date));
    expect(response.updatedAt).toEqual(expect.any(Date));

    // test for specific values
    expect(response.proposalTitle).toEqual('some title');
  });

  afterAll(async () => {
    // Delete user registration options
    await dbPool
      .delete(db.usersToRegistrationOptions)
      .where(eq(db.usersToRegistrationOptions.userId, user?.id ?? ''));

    // Delete registrations
    await dbPool.delete(db.registrations).where(eq(db.registrations.userId, user?.id ?? ''));

    // Delete user to groups
    await dbPool.delete(db.usersToGroups).where(eq(db.usersToGroups.userId, user?.id ?? ''));

    // Delete groups
    await dbPool.delete(db.groups).where(
      inArray(
        db.groups.id,
        defaultGroups.map((g) => g.id),
      ),
    );

    // Delete registration options
    await dbPool.delete(db.registrationOptions).where(
      inArray(
        db.registrationOptions.id,
        defaultRegistrations.map((r) => r.id),
      ),
    );

    // delete user
    await dbPool.delete(db.users).where(eq(db.users.id, user?.id ?? ''));

    await dbConnection.end();
  });
});
