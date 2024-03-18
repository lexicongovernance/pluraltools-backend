import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { getGroups, getGroupsByCategoryId } from '../services/groups';
import { isLoggedIn } from '../middleware/isLoggedIn';
const router = express.Router();

export function groupsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', isLoggedIn(dbPool), getGroups(dbPool));
  router.get(
    '/group-categories/:groupCategoryId',
    isLoggedIn(dbPool),
    getGroupsByCategoryId(dbPool),
  );
  return router;
}
