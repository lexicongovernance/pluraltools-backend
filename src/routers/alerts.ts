import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { getActiveAlerts } from '../handlers/alerts';
const router = express.Router();

export function alertsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', getActiveAlerts(dbPool));
  return router;
}
