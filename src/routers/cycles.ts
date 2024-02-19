import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { getActiveCycles, getCycleById } from '../services/cycles';
import { getVotes, saveVote } from '../services/votes';

const router = express.Router();

export function cyclesRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', isLoggedIn(), getActiveCycles(dbPool));
  router.get('/:cycleId', isLoggedIn(), getCycleById(dbPool));
  router.get('/:cycleId/votes', isLoggedIn(), getVotes(dbPool));
  router.post('/:cycleId/votes', isLoggedIn(), saveVote(dbPool));
  return router;
}
