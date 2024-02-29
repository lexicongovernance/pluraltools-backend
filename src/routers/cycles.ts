import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { getActiveCycles, getCycleById } from '../services/cycles';
import { getVotes, saveVotes } from '../services/votes';

const router = express.Router();

export function cyclesRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', isLoggedIn(dbPool), getActiveCycles(dbPool));
  router.get('/:cycleId', isLoggedIn(dbPool), getCycleById(dbPool));
  router.get('/:cycleId/votes', isLoggedIn(dbPool), getVotes(dbPool));
  router.post('/:cycleId/votes', isLoggedIn(dbPool), saveVotes(dbPool));
  return router;
}
