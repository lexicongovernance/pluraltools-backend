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
  let testData: z.infer<typeof insertRegistrationSchema>;
  let defaultEvent: db.Event;
  let defaultRegistrationField: db.RegistrationField;
  let defaultRegistrationFieldOptions: db.RegistrationFieldOption[];
  beforeAll(async () => {
    const initDb = createDbPool(DB_CONNECTION_URL, { max: 1 });
    await runMigrations(DB_CONNECTION_URL);
    dbPool = initDb.dbPool;
    dbConnection = initDb.connection;
    user = (await dbPool.insert(db.users).values({}).returning())[0];
    // create event
    defaultEvent = (
      await dbPool
        .insert(db.events)
        .values({
          name: 'test event',
        })
        .returning()
    )[0]!;
    // create registration field
    defaultRegistrationField = (
      await dbPool
        .insert(db.registrationFields)
        .values({
          name: 'test field',
          type: 'SELECT',
          eventId: defaultEvent.id,
        })
        .returning()
    )[0]!;
    // Insert registration fields for the user
    testData = {
      userId: user!.id,
      eventId: defaultEvent.id,
      status: 'DRAFT',
      registrationData: [
        {
          registrationFieldId: defaultRegistrationField.id,
          value: 'option2',
        },
      ],
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
    // check registration data
    expect(response.registrationData).toEqual(expect.any(Array));
    expect(response.registrationData).toHaveLength(1);
    // Check array element properties
    response.registrationData!.forEach((data) => {
      expect(data).toHaveProperty('value');
      expect(data).toHaveProperty('registrationFieldId');
    });
    // check timestamps
    expect(response.createdAt).toEqual(expect.any(Date));
    expect(response.updatedAt).toEqual(expect.any(Date));
  });
  afterAll(async () => {
    // Delete events
    await dbPool.delete(db.events).where(eq(db.events.id, defaultEvent.id));
    // Delete registration data
    await dbPool
      .delete(db.registrationData)
      .where(eq(db.registrationData.registrationFieldId, defaultRegistrationField.id)),
      // Delete registration fields
      await dbPool
        .delete(db.registrationFields)
        .where(eq(db.registrationFields.id, defaultRegistrationField.id));
    // Delete registrations
    await dbPool.delete(db.registrations).where(eq(db.registrations.userId, user?.id ?? ''));
    // delete user
    await dbPool.delete(db.users).where(eq(db.users.id, user?.id ?? ''));
    await dbConnection.end();
  });
});
