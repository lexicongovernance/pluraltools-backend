import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { getOptionCommentsHandler, getOptionHandler } from '../handlers/options';

const router = express.Router();

export function optionsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/:optionId', isLoggedIn(dbPool), getOptionHandler(dbPool));
  router.get('/:optionId/comments', isLoggedIn(dbPool), getOptionCommentsHandler(dbPool));

  return router;
}
