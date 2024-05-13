import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import {
  getOptionAuthorsHandler,
  getOptionCommentsHandler,
  getOptionHandler,
} from '../handlers/options';
import { isLoggedIn } from '../middleware/is-logged-in';

const router = express.Router();

export function optionsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/:optionId', isLoggedIn(dbPool), getOptionHandler(dbPool));
  router.get('/:optionId/comments', isLoggedIn(dbPool), getOptionCommentsHandler(dbPool));
  router.get('/:optionId/authors', isLoggedIn(dbPool), getOptionAuthorsHandler(dbPool));
  return router;
}
