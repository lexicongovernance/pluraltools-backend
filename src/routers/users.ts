import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import {
  getUserAttributesHandler,
  getUserGroupsHandler,
  getUserHandler,
  getUserOptionsHandler,
  getUserRegistrationsHandler,
  updateUserHandler,
} from '../handlers/users';
import { isLoggedIn } from '../middleware/is-logged-in';

const router = express.Router();

export function usersRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', isLoggedIn(dbPool), getUserHandler(dbPool));
  router.put('/:userId', isLoggedIn(dbPool), updateUserHandler(dbPool));
  router.get('/:userId/groups', isLoggedIn(dbPool), getUserGroupsHandler(dbPool));
  router.get('/:userId/attributes', isLoggedIn(dbPool), getUserAttributesHandler(dbPool));
  router.get('/:userId/options', isLoggedIn(dbPool), getUserOptionsHandler(dbPool));
  router.get('/:userId/registrations', isLoggedIn(dbPool), getUserRegistrationsHandler(dbPool));
  return router;
}
