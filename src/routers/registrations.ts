import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { getRegistration, saveRegistration } from '../services/registrations';
const router = express.Router();

export function registrationsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.post('/', isLoggedIn(), saveRegistration(dbPool));
  router.get('/', isLoggedIn(), getRegistration(dbPool));

  return router;
}
