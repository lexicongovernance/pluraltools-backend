import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/is-logged-in';
import { getActiveCyclesHandler, getCycleHandler, getCycleVotesHandler } from '../handlers/cycles';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

const router = express.Router();

export function cyclesRouter({ dbPool }: { dbPool: NodePgDatabase<typeof db> }) {
  router.get('/', isLoggedIn(dbPool), getActiveCyclesHandler(dbPool));
  router.get('/:cycleId', isLoggedIn(dbPool), getCycleHandler(dbPool));
  router.get('/:cycleId/votes', isLoggedIn(dbPool), getCycleVotesHandler(dbPool));
  return router;
}
