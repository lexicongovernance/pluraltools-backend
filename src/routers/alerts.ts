import { default as express } from 'express';
import type * as schema from '../db/schema';
import { getActiveAlerts } from '../handlers/alerts';
import { isLoggedIn } from '../middleware/is-logged-in';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
const router = express.Router();

export function alertsRouter({ dbPool }: { dbPool: NodePgDatabase<typeof schema> }) {
  router.get('/', isLoggedIn(dbPool), getActiveAlerts(dbPool));
  return router;
}
