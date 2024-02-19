import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { deleteLike, getLike, saveLike } from '../services/likes';
const router = express.Router();

export function commentsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/:commentId/like', isLoggedIn(), getLike(dbPool));
  router.post('/:commentId/like', isLoggedIn(), saveLike(dbPool));
  router.delete('/:commentId/like', isLoggedIn(), deleteLike(dbPool));
  return router;
}
