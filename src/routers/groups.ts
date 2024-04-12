import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import {
  createGroupHandler,
  getGroupRegistrationsHandler,
  getGroupsHandler,
} from '../handlers/groups';
const router = express.Router();

export function groupsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', isLoggedIn(dbPool), getGroupsHandler(dbPool));
  router.post('/', isLoggedIn(dbPool), createGroupHandler(dbPool));
  router.get('/:id/registrations', isLoggedIn(dbPool), getGroupRegistrationsHandler(dbPool));

  return router;
}
