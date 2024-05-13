import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/is-logged-in';
import {
  getGroupCategoriesGroupsHandler,
  getGroupCategoriesHandler,
  getGroupCategoryHandler,
} from '../handlers/group-categories';

const router = express.Router();

export function groupCategoriesRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', isLoggedIn(dbPool), getGroupCategoriesHandler(dbPool));
  router.get('/:id', isLoggedIn(dbPool), getGroupCategoryHandler(dbPool));
  router.get('/:name/groups', isLoggedIn(dbPool), getGroupCategoriesGroupsHandler(dbPool));

  return router;
}