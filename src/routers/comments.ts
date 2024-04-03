import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import {
  deleteCommentLikeHandler,
  getCommentLikesHandler,
  saveCommentLikeHandler,
} from '../handlers/comments';
const router = express.Router();

export function commentsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/:commentId/likes', isLoggedIn(dbPool), getCommentLikesHandler(dbPool));
  router.post('/:commentId/likes', isLoggedIn(dbPool), saveCommentLikeHandler(dbPool));
  router.delete('/:commentId/likes', isLoggedIn(dbPool), deleteCommentLikeHandler(dbPool));
  return router;
}
