import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import {
  getRegistrationDataHandler,
  saveRegistrationHandler,
  updateRegistrationHandler,
} from '../handlers/registrations';

const router = express.Router();

export function registrationsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.post('/', isLoggedIn(dbPool), saveRegistrationHandler(dbPool));
  router.put('/:id', isLoggedIn(dbPool), updateRegistrationHandler(dbPool));
  router.get('/:id/registration-data', isLoggedIn(dbPool), getRegistrationDataHandler(dbPool));

  return router;
}
