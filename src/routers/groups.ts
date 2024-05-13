import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/is-logged-in';
import {
  createGroupHandler,
  getGroupRegistrationsHandler,
  getGroupMembersHandler,
} from '../handlers/groups';
const router = express.Router();

export function groupsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.post('/', isLoggedIn(dbPool), createGroupHandler(dbPool));
  router.get('/:id/registrations', isLoggedIn(dbPool), getGroupRegistrationsHandler(dbPool));
  router.get('/:id/users-to-groups', isLoggedIn(dbPool), getGroupMembersHandler(dbPool));
  return router;
}
