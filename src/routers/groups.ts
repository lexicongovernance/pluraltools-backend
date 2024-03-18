import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { getGroups } from '../services/groups';
import { isLoggedIn } from '../middleware/isLoggedIn';
const router = express.Router();

export function groupsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', isLoggedIn(dbPool), getGroups(dbPool));
  return router;
}
