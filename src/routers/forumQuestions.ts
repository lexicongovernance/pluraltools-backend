import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { getQuestionHearts } from '../services/forumQuestions';
import { getResultStatistics } from '../services/statistics';
import { isLoggedIn } from '../middleware/isLoggedIn';
const router = express.Router();

export function forumQuestionsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/:forumQuestionId/hearts', isLoggedIn(), getQuestionHearts(dbPool));
  router.get('/:forumQuestionId/statistics', isLoggedIn(), getResultStatistics(dbPool));
  return router;
}
