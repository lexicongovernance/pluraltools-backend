import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/is-logged-in';
import {
  getGroupCategoriesGroupsHandler,
  getGroupCategoriesHandler,
  getGroupCategoryHandler,
} from '../handlers/group-categories';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

const router = express.Router();

export function groupCategoriesRouter({ dbPool }: { dbPool: NodePgDatabase<typeof db> }) {
  router.get('/', isLoggedIn(dbPool), getGroupCategoriesHandler(dbPool));
  router.get('/:id', isLoggedIn(dbPool), getGroupCategoryHandler(dbPool));
  router.get('/:id/groups', isLoggedIn(dbPool), getGroupCategoriesGroupsHandler(dbPool));

  return router;
}
