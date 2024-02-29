import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { getUser, getUserAttributes, updateUser } from '../services/users';
import { getGroupsPerUser } from '../services/groups';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { getUserOptions } from '../services/options';
const router = express.Router();

export function usersRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', isLoggedIn(dbPool), getUser(dbPool));
  router.put('/:userId', isLoggedIn(dbPool), updateUser(dbPool));
  router.get('/:userId/groups', isLoggedIn(dbPool), getGroupsPerUser(dbPool));
  router.get('/:userId/attributes', isLoggedIn(dbPool), getUserAttributes(dbPool));
  router.get('/:userId/options', isLoggedIn(dbPool), getUserOptions(dbPool));
  return router;
}
