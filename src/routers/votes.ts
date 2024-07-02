import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/is-logged-in';
import { saveVotesHandler } from '../handlers/votes';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

const router = express.Router();

export function votesRouter({ dbPool }: { dbPool: NodePgDatabase<typeof db> }) {
  router.post('/', isLoggedIn(dbPool), saveVotesHandler(dbPool));
  return router;
}
