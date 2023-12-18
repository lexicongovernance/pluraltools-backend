import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { saveUsersToRegistrationOptions } from './registrationOptions';
import { eq, inArray } from 'drizzle-orm';
import { createDbPool } from '../utils/db/createDbPool';
import postgres from 'postgres';
import { runMigrations } from '../utils/db/runMigrations';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: registrationOptions', function () {
  let dbPool: PostgresJsDatabase<typeof db>;
  let dbConnection: postgres.Sql<{}>;
  let user: db.User | undefined;
  let defaultRegistrations: db.RegistrationOption[];

  beforeAll(async function () {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    user = (await dbPool.insert(db.users).values({}).returning())[0];
  });

  test('should throw an error if it tries to delete a non-existing record', async () => {
    const userId = 'testUserId_0';

    // Mock console.log to spy on its calls
    const consoleLogSpy = jest.spyOn(console, 'log');

    const result = await saveUsersToRegistrationOptions(dbPool, userId, []); // define empty options

    // Check if result is null
    expect(result).toBeNull();

    // Check that an error message is logged (substring match)
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('error deleting user registration options'),
    );

    // Restore the original console.log method to avoid interference with other tests
    consoleLogSpy.mockRestore();
  });

  afterAll(async function () {
    // delete user
    await dbPool.delete(db.users).where(eq(db.users.id, user?.id ?? ''));
    await dbConnection.end();
  });
});
