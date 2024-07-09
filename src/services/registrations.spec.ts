import * as db from '../db';
import { createDbClient } from '../utils/db/create-db-connection';
import { runMigrations } from '../utils/db/run-migrations';
import {
  validateCreateRegistrationAuthorization,
  validateUpdateRegistrationAuthorization,
} from './registrations';
import { environmentVariables } from '../types';
import { cleanup, seed } from '../utils/db/seed';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { eq } from 'drizzle-orm';

describe('service: registrations', () => {
  let dbPool: NodePgDatabase<typeof db>;
  let dbConnection: Client;
  let userId: string;
  let eventId: string;
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
    const { users, events } = await seed(dbPool);
    userId = users?.[0]?.id ?? '';
    eventId = events?.[0]?.id ?? '';
  });

  describe('validate: create registration authorization', function () {
    test('when the user is not in the group', async function () {
      const notRealGroupId = userId;

      const result = await validateCreateRegistrationAuthorization({
        dbPool,
        userId,
        groupId: notRealGroupId,
      });

      expect(result).toBe(false);
    });
    test('when the user is in the group', async function () {
      const group = await dbPool.query.usersToGroups.findFirst({
        where: eq(db.usersToGroups.userId, userId),
      });

      if (!group) {
        throw new Error('No group found');
      }

      const result = await validateCreateRegistrationAuthorization({
        dbPool,
        userId,
        groupId: group.groupId,
      });

      expect(result).toBe(true);
    });
  });

  describe('validate: update registration authorization', function () {
    test('when the user is not in the group', async function () {
      const rows = await dbPool
        .insert(db.registrations)
        .values({
          eventId: eventId,
          userId: userId,
        })
        .returning();

      if (!rows) {
        throw new Error('No registration found');
      }

      if (!rows[0]) {
        throw new Error('No registration found');
      }

      const notRealGroupId = userId;
      const result = await validateUpdateRegistrationAuthorization({
        dbPool,
        userId,
        groupId: notRealGroupId,
        registrationId: rows[0].id,
      });

      expect(result).toBe(false);
    });
    test('when the user is in the group', async function () {
      const rows = await dbPool
        .insert(db.registrations)
        .values({
          eventId: eventId,
          userId: userId,
        })
        .returning();

      if (!rows) {
        throw new Error('No registration found');
      }

      if (!rows[0]) {
        throw new Error('No registration found');
      }

      const userGroup = await dbPool.query.usersToGroups.findFirst({
        where: eq(db.usersToGroups.userId, userId),
      });

      if (!userGroup) {
        throw new Error('No group found');
      }

      const result = await validateUpdateRegistrationAuthorization({
        dbPool,
        userId,
        groupId: userGroup.groupId,
        registrationId: rows[0].id,
      });

      expect(result).toBe(true);
    });
  });
  afterAll(async () => {
    // Delete registration data
    await cleanup(dbPool);
    await dbConnection.end();
  });
});
