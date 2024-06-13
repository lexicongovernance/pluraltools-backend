import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/is-logged-in';
import {
  joinGroupsHandler,
  leaveGroupsHandler,
  updateGroupsHandler,
} from '../handlers/users-to-groups';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

const router = express.Router();

export function usersToGroupsRouter({ dbPool }: { dbPool: NodePgDatabase<typeof db> }) {
  router.post('/', isLoggedIn(dbPool), joinGroupsHandler(dbPool));
  router.put('/:id', isLoggedIn(dbPool), updateGroupsHandler(dbPool));
  router.delete('/:id', isLoggedIn(dbPool), leaveGroupsHandler(dbPool));
  return router;
}
