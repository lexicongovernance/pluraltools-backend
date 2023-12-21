import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { saveVote } from '../services/votes';
const router = express.Router();

export function votesRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.post('/', isLoggedIn(), saveVote(dbPool));
  return router;
}
