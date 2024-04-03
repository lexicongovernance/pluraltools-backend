import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { getActiveCyclesHandler, getCycleHandler, getCycleVotesHandler } from '../handlers/cycles';

const router = express.Router();

export function cyclesRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', isLoggedIn(dbPool), getActiveCyclesHandler(dbPool));
  router.get('/:cycleId', isLoggedIn(dbPool), getCycleHandler(dbPool));
  router.get('/:cycleId/votes', isLoggedIn(dbPool), getCycleVotesHandler(dbPool));
  return router;
}
