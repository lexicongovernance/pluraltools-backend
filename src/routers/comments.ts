import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { saveComment } from '../services/comments';
import { getCommentsForOption } from '../services/comments';
const router = express.Router();

export function commentsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/:questionOptionId/comment-data', isLoggedIn(), getCommentsForOption(dbPool));
  router.post('/:questionOptionId/comment', isLoggedIn(), saveComment(dbPool));
  return router;
}
