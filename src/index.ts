import { default as express } from 'express';
import { apiRouter } from './routers/api';
import { environmentVariables } from './types';
import { logger } from './utils/logger';
import { createDbPool, runMigrations } from './db';
const app = express();

async function main() {
  const envVariables = environmentVariables.parse(process.env);
  const { db } = createDbPool({
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

  app.use('/api', apiRouter({ dbPool: db, cookiePassword: envVariables.COOKIE_PASSWORD }));
  app.listen(!isNaN(Number(envVariables.PORT)) ? envVariables.PORT! : 8080, '0.0.0.0', () => {
    logger.info(`Listening on :${envVariables.PORT ?? 8080}`);
  });
}

main();
