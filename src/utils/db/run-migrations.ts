import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDbPool } from './create-db-pool';

export async function runMigrations(dbConnectionUrl: string) {
  const { dbPool, connection } = createDbPool(dbConnectionUrl, { max: 1 });
  await migrate(dbPool, { migrationsFolder: 'migrations' });
  await connection.end();
}
