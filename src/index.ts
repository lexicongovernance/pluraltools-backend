import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { default as express } from 'express';
import { environmentVariables } from './types';
import { apiRouter } from './routers/api';
import { createDbPool } from './utils/createDbPool';
import { z } from 'zod';
const app = express();

async function runMigrations(envVariables: z.infer<typeof environmentVariables>) {
  const { dbPool } = createDbPool(envVariables.DB_CONNECTION_URL, { max: 1 });
  await migrate(dbPool, { migrationsFolder: 'migrations' });
}

async function main() {
  // setup
  const envVariables = environmentVariables.parse(process.env);
  const { dbPool } = createDbPool(envVariables.DB_CONNECTION_URL, {});
  // run migrations
  await runMigrations(envVariables);
  app.use('/api', apiRouter({ dbPool }));
  app.listen(
    !isNaN(Number(envVariables.PORT)) ? Number(envVariables.PORT) : 8080,
    '0.0.0.0',
    () => {
      console.log(`Listening on port: ${envVariables.PORT ?? 8080}`);
    },
  );
}

main();
