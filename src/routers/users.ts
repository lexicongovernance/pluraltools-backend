import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { getUser, getUserAttributes, updateUser } from '../services/users';
import { getGroupsPerUser } from '../services/groups';
import { isLoggedIn } from '../middleware/isLoggedIn';
const router = express.Router();

export function usersRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', isLoggedIn(), getUser(dbPool));
  router.put('/:userId', isLoggedIn(), updateUser(dbPool));
  router.get('/:userId/groups', isLoggedIn(), getGroupsPerUser(dbPool));
  router.get('/:userId/attributes', isLoggedIn(), getUserAttributes(dbPool));
  return router;
}
