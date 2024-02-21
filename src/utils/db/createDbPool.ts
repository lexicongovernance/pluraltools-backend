import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import pgConnectionString from 'pg-connection-string';
import * as db from '../../db';

/**
 * creates a postgres database pool connection from connection string
 */
export function createDbPool(
  dbConnectionUrl: string,
  overwriteOptions: postgres.Options<NonNullable<unknown>> | undefined,
) {
  const connectionConfig = pgConnectionString.parse(dbConnectionUrl);
  const defaultOptions: postgres.Options<NonNullable<unknown>> | undefined = {
    host: connectionConfig.host ?? undefined,
    port: connectionConfig.port ? parseInt(connectionConfig.port) : undefined,
    user: connectionConfig.user,
    password: connectionConfig.password,
    database: connectionConfig.database ?? undefined,
    ssl: connectionConfig.ssl as undefined,
  };
  const sql = postgres({ ...defaultOptions, ...overwriteOptions });
  return { dbPool: drizzle(sql, { schema: db }), connection: sql };
}
