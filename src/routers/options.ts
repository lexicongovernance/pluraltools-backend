import { default as express } from 'express';
import type * as schema from '../db/schema';
import {
  getOptionUsersHandler,
  getOptionCommentsHandler,
  getOptionHandler,
  saveOptionHandler,
  updateOptionHandler,
} from '../handlers/options';
import { isLoggedIn } from '../middleware/is-logged-in';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

const router = express.Router();

export function optionsRouter({ dbPool }: { dbPool: NodePgDatabase<typeof schema> }) {
  router.post('/', isLoggedIn(dbPool), saveOptionHandler(dbPool));
  router.put('/:optionId', isLoggedIn(dbPool)), updateOptionHandler(dbPool);
  router.get('/:optionId', isLoggedIn(dbPool), getOptionHandler(dbPool));
  router.get('/:optionId/comments', isLoggedIn(dbPool), getOptionCommentsHandler(dbPool));
  router.get('/:optionId/users', isLoggedIn(dbPool), getOptionUsersHandler(dbPool));
  return router;
}
