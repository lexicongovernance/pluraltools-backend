import { createDbPool } from '../src/utils/db/createDbPool';
import { cleanup, seed } from '../src/utils/db/seed';

const DEFAULT_DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';

if (process.argv.includes('--cleanup')) {
  const dbConnectionUrl = process.env.DB_CONNECTION_URL ?? DEFAULT_DB_CONNECTION_URL;
  const { dbPool, connection } = createDbPool(dbConnectionUrl, { max: 1 });
  await cleanup(dbPool);
  await connection.end();
  console.log('Cleaned up database');
} else {
  const dbConnectionUrl = process.env.DB_CONNECTION_URL ?? DEFAULT_DB_CONNECTION_URL;
  const { dbPool, connection } = createDbPool(dbConnectionUrl, { max: 1 });
  await seed(dbPool);
  await connection.end();
  console.log('Seeded database');
}
