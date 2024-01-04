import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { getUser, getRegistration, getVotes } from '../services/users';
import { isLoggedIn } from '../middleware/isLoggedIn';
const router = express.Router();

export function usersRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', isLoggedIn(), getUser(dbPool));
  router.get('/:userId/registration', isLoggedIn(), getRegistration(dbPool));
  router.get('/:userId/cycles/:cycleId/votes', isLoggedIn(), getVotes(dbPool));
  return router;
}
