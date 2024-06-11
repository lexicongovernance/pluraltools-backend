import { default as express } from 'express';
import type * as db from '../db';
import { getActiveAlerts } from '../handlers/alerts';
import { isLoggedIn } from '../middleware/is-logged-in';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
const router = express.Router();

export function alertsRouter({ dbPool }: { dbPool: NodePgDatabase<typeof db> }) {
  router.get('/', isLoggedIn(dbPool), getActiveAlerts(dbPool));
  return router;
}
