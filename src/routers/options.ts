import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { getOption } from '../services/options';
import { saveComment, getCommentsForOption, deleteComment } from '../services/comments';

const router = express.Router();

export function optionsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/:optionId', isLoggedIn(), getOption(dbPool));
  router.get('/:optionId/comments', isLoggedIn(), getCommentsForOption(dbPool));
  router.post('/:optionId/comments', isLoggedIn(), saveComment(dbPool));
  router.delete('/:optionId/comments/:commentId', isLoggedIn(), deleteComment(dbPool));
  return router;
}
