import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { getQuestionHeartsHandler, getResultStatisticsHandler } from '../handlers/forumQuestions';
const router = express.Router();

export function forumQuestionsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/:forumQuestionId/hearts', isLoggedIn(dbPool), getQuestionHeartsHandler(dbPool));
  router.get(
    '/:forumQuestionId/statistics',
    isLoggedIn(dbPool),
    getResultStatisticsHandler(dbPool),
  );
  return router;
}
