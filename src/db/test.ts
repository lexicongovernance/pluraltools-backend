import { z } from 'zod';
import { environmentVariables } from '../types';
import { Client } from 'pg';
import { createDbClient } from './create-db-connection';
import { runMigrations } from './run-migrations';

export async function createTestDatabase(envVariables: z.infer<typeof environmentVariables>) {
  const initDb = await createDbClient({
    database: envVariables.DATABASE_NAME, // Use the original database name here
    host: envVariables.DATABASE_HOST,
    password: envVariables.DATABASE_PASSWORD,
    user: envVariables.DATABASE_USER,
    port: envVariables.DATABASE_PORT,
  });

  // use node postgres to create a random new
  // database for testing
  const testDbName = createTestDatabaseName(envVariables.DATABASE_NAME);
  await initDb.client.query(`CREATE DATABASE "${testDbName}"`);
  // disconnect from the original database
  await initDb.client.end();
  // connect to the new database
  const newClient = await createDbClient({
    database: testDbName,
    host: envVariables.DATABASE_HOST,
    password: envVariables.DATABASE_PASSWORD,
    user: envVariables.DATABASE_USER,
    port: envVariables.DATABASE_PORT,
  });

  // run migrations
  await runMigrations({
    database: testDbName,
    host: envVariables.DATABASE_HOST,
    password: envVariables.DATABASE_PASSWORD,
    user: envVariables.DATABASE_USER,
    port: envVariables.DATABASE_PORT,
  });

  return {
    dbClient: newClient,
    teardown: async () => {
      await teardownTestDatabase(newClient.client, testDbName);
    },
  };
}

function createTestDatabaseName(name: string) {
  return `${name}_test_${Math.random().toString(36).substring(7)}`;
}

async function teardownTestDatabase(client: Client, name: string) {
  await client.end();

  // connect to the default 'postgres' database
  const dropClient = new Client({
    host: client.host,
    port: client.port,
    user: client.user,
    password: client.password,
    database: 'postgres', // Connect to the default database
  });

  await dropClient.connect();

  // Terminate all connections to the test database
  await dropClient.query(
    `
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = $1
      AND pid <> pg_backend_pid();
  `,
    [name],
  );

  await dropClient.query(`DROP DATABASE IF EXISTS ${name}`);

  await dropClient.end();
}
