import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { getOption } from '../services/options';

const router = express.Router();

export function optionsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/:optionId', isLoggedIn(), getOption(dbPool));
  return router;
}
