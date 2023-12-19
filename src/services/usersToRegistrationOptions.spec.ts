import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { overwriteUsersToRegistrationOptions } from './usersToRegistrationOptions';
import { eq, inArray } from 'drizzle-orm';
import { createDbPool } from '../utils/db/createDbPool';
import postgres from 'postgres';
import { runMigrations } from '../utils/db/runMigrations';

const DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

describe('service: usersToRegistrationOptions', function () {
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
    const dbRegistrationOptions = registrationOptions.map((registrationOptionId) => ({
      name: registrationOptionId,
      category: 'Example Category',
    }));
    defaultRegistrations = await dbPool
      .insert(db.registrationOptions)
      .values(dbRegistrationOptions)
      .returning();
  });

  test('should save initial registration options', async () => {
    const initialRegistrationOptions = defaultRegistrations.map((r) => r.id);
    const result = await overwriteUsersToRegistrationOptions(dbPool, user?.id || '', [
      initialRegistrationOptions[0] ?? '',
    ]);

    expect(result?.[0]).toBeDefined();
    expect(result?.[0]?.userId).toBe(user?.id);
  });

  test('should overwrite registration options', async () => {
    // Insert some initial registration options for the user
    const initialRegistrationOptions = defaultRegistrations.map((r) => r.id);
    const result = await overwriteUsersToRegistrationOptions(dbPool, user?.id || '', [
      initialRegistrationOptions[1] ?? '',
    ]);

    // Check if result is not null (indicating success)
    expect(result).toBeDefined();
    expect(result?.[0]?.userId).toBe(user?.id);
    expect(result?.[0]?.registrationOptionId).toBe(initialRegistrationOptions[1]);
  });

  afterAll(async function () {
    // Delete user registration options
    await dbPool
      .delete(db.usersToRegistrationOptions)
      .where(eq(db.usersToRegistrationOptions.userId, user?.id ?? ''));

    // delete registration options
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
