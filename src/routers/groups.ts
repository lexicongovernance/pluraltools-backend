import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import {
  getGroups,
  getGroupsByCategoryId,
  getGroupsPerUser,
  getGroupsPerUserByCategoryId,
} from '../services/groups';
import { isLoggedIn } from '../middleware/isLoggedIn';
const router = express.Router();

export function groupsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/groups', isLoggedIn(dbPool), getGroups(dbPool));
  router.get('/groups/:groupCategoryId', isLoggedIn(dbPool), getGroupsByCategoryId(dbPool));
  router.get('/groups/:userId', isLoggedIn(dbPool), getGroupsPerUser(dbPool));
  router.get(
    '/groups/:userId/:groupCategoryId',
    isLoggedIn(dbPool),
    getGroupsPerUserByCategoryId(dbPool),
  );
  return router;
}
