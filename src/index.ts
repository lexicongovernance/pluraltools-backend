import { default as express } from 'express';
import { apiRouter } from './routers/api';
import { environmentVariables } from './types';
import { createDbPool } from './utils/db/create-db-pool';
import { runMigrations } from './utils/db/run-migrations';
const app = express();

async function main() {
  const envVariables = environmentVariables.parse(process.env);
  const { dbPool } = createDbPool(envVariables.DB_CONNECTION_URL, {});
  await runMigrations(envVariables.DB_CONNECTION_URL);
  app.use('/api', apiRouter({ dbPool, cookiePassword: envVariables.COOKIE_PASSWORD }));
  app.listen(
    !isNaN(Number(envVariables.PORT)) ? Number(envVariables.PORT) : 8080,
    '0.0.0.0',
    () => {
      console.log(`Listening on port: ${envVariables.PORT ?? 8080}`);
    },
  );
}

main();
