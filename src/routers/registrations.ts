import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { getRegistrationDataHandler } from '../handlers/registrations';

const router = express.Router();

export function registrationsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.post('/', isLoggedIn(dbPool));
  router.get('/:id/registration-data', isLoggedIn(dbPool), getRegistrationDataHandler(dbPool));
  return router;
}
