import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDbClient } from './create-db-connection';

export async function runMigrations({
  database,
  host,
  password,
  user,
  port,
}: {
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
}) {
  const { db, client } = await createDbClient({ database, host, password, user, port });
  await migrate(db, { migrationsFolder: 'migrations' });
  await client.end();
}
