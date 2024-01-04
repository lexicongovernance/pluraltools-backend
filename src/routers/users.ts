import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { getUser, getVotes } from '../services/users';
import { isLoggedIn } from '../middleware/isLoggedIn';
const router = express.Router();

export function usersRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', isLoggedIn(), getUser(dbPool));
  router.get('/:userId/options/:optionId/votes', isLoggedIn(), getVotes(dbPool));
  return router;
}
