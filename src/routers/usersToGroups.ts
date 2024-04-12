import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { joinGroupsHandler } from '../handlers/usersToGroups';

const router = express.Router();

export function usersToGroupsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.post('/', isLoggedIn(dbPool), joinGroupsHandler(dbPool));
  return router;
}
