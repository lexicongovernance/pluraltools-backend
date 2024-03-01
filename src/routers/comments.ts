import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { deleteLike, getLikes, saveLike } from '../services/likes';
const router = express.Router();

export function commentsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/:commentId/likes', isLoggedIn(dbPool), getLikes(dbPool));
  router.post('/:commentId/likes', isLoggedIn(dbPool), saveLike(dbPool));
  router.delete('/:commentId/likes', isLoggedIn(dbPool), deleteLike(dbPool));
  return router;
}
