import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { default as express } from 'express';
import { environmentVariables } from './types';
import * as db from './db';
import { apiRouter } from './routers/api';
const app = express();

async function runMigrations(dbUrl: string) {
  const sql = postgres(dbUrl, { max: 1 });
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: 'migrations' });
}

async function main() {
  // setup
  const envVariables = environmentVariables.parse(process.env);
  const sql = postgres(envVariables.DB_CONNECTION_URL);
  const dbPool = drizzle(sql, { schema: db });

  // run
  await runMigrations(envVariables.DB_CONNECTION_URL);
  app.use('/api', apiRouter({ dbPool }));
  app.listen(isNaN(Number(envVariables.PORT)) ? Number(envVariables.PORT) : 8080, '0.0.0.0', () => {
    console.log(`Listening on port: ${envVariables.PORT ?? 8080}`);
  });
}

main();
