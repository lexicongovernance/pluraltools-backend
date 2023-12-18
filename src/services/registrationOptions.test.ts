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

    // Insert registration options for the user
    const registrationOptions = ['option1', 'option2', 'option3'];
    const userRegistrationOptions = registrationOptions.map((registrationOptionId) => ({
      id: registrationOptionId,
      name: 'Example Name',
      category: 'Example Category',
      created_at: new Date(),
      updated_at: new Date(),
    }));
    await dbPool.insert(db.registrationOptions).values(userRegistrationOptions).execute();
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

  test('should delete existing user data and log "Deletion successful."', async () => {
    // Insert some initial registration options for the user
    const initialRegistrationOptions = ['option1', 'option2', 'option3'];
    await saveUsersToRegistrationOptions(dbPool, user?.id || '', initialRegistrationOptions);

    // Mock console.log to spy on its calls
    const consoleLogSpy = jest.spyOn(console, 'log');

    // Call the function to delete existing user data
    const result = await saveUsersToRegistrationOptions(dbPool, user?.id || '', []);

    // Check if result is not null (indicating success)
    expect(result).toBeNull();

    // Check that console.log is called with the expected message
    expect(consoleLogSpy).toHaveBeenCalledWith('Deletion successful.');

    // Restore the original console.log method to avoid interference with other tests
    consoleLogSpy.mockRestore();
  });

  afterAll(async function () {
    // Delete user registration options
    await dbPool
      .delete(db.usersToRegistrationOptions)
      .where(eq(db.usersToRegistrationOptions.userId, user?.id ?? ''));

    // delete user
    await dbPool.delete(db.users).where(eq(db.users.id, user?.id ?? ''));
    await dbConnection.end();
  });
});
