import { default as express } from 'express';
import type * as db from '../db';
import {
  getOptionUsersHandler,
  getOptionCommentsHandler,
  getOptionHandler,
} from '../handlers/options';
import { isLoggedIn } from '../middleware/is-logged-in';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

const router = express.Router();

export function optionsRouter({ dbPool }: { dbPool: NodePgDatabase<typeof db> }) {
  router.get('/:optionId', isLoggedIn(dbPool), getOptionHandler(dbPool));
  router.get('/:optionId/comments', isLoggedIn(dbPool), getOptionCommentsHandler(dbPool));
  router.get('/:optionId/users', isLoggedIn(dbPool), getOptionUsersHandler(dbPool));
  return router;
}
