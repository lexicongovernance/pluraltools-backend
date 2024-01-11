import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { getActiveQuestionHearts } from '../services/availableHearts';
import { isLoggedIn } from '../middleware/isLoggedIn';
const router = express.Router();

export function forumQuestionsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  // /api/forum-questions/:forumQuestionId/available-hearts
  router.get('/:forumQuestionId/available-hearts', isLoggedIn(), getActiveQuestionHearts(dbPool));
  return router;
}
