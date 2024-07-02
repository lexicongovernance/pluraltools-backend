import { default as express } from 'express';
import type * as db from '../db';
import {
  getUserAttributesHandler,
  getUsersToGroupsHandler,
  getUserHandler,
  getUserOptionsHandler,
  getUserRegistrationsHandler,
  updateUserHandler,
} from '../handlers/users';
import { isLoggedIn } from '../middleware/is-logged-in';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

const router = express.Router();

export function usersRouter({ dbPool }: { dbPool: NodePgDatabase<typeof db> }) {
  router.get('/', isLoggedIn(dbPool), getUserHandler(dbPool));
  router.put('/:userId', isLoggedIn(dbPool), updateUserHandler(dbPool));
  router.get('/:userId/users-to-groups', isLoggedIn(dbPool), getUsersToGroupsHandler(dbPool));
  router.get('/:userId/attributes', isLoggedIn(dbPool), getUserAttributesHandler(dbPool));
  router.get('/:userId/options', isLoggedIn(dbPool), getUserOptionsHandler(dbPool));
  router.get('/:userId/registrations', isLoggedIn(dbPool), getUserRegistrationsHandler(dbPool));
  return router;
}
