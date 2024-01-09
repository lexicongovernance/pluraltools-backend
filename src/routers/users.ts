import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { getUser, getVotes, updateUser } from '../services/users';
import { getGroupsPerUser } from '../services/groups';
import { isLoggedIn } from '../middleware/isLoggedIn';
const router = express.Router();

export function usersRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', isLoggedIn(), getUser(dbPool));
  router.put('/', isLoggedIn(), updateUser(dbPool));
  router.get('/:userId/options/:optionId/votes', isLoggedIn(), getVotes(dbPool));
  router.get('/:userId/groups', isLoggedIn(), getGroupsPerUser(dbPool));
  return router;
}
