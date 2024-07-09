import { default as express } from 'express';
import type * as schema from '../db/schema';
import { isLoggedIn } from '../middleware/is-logged-in';
import {
  getCalculateFundingHandler,
  getQuestionHeartsHandler,
  getResultStatisticsHandler,
} from '../handlers/questions';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
const router = express.Router();

export function forumQuestionsRouter({ dbPool }: { dbPool: NodePgDatabase<typeof schema> }) {
  router.get('/:forumQuestionId/hearts', isLoggedIn(dbPool), getQuestionHeartsHandler(dbPool));
  router.get(
    '/:forumQuestionId/statistics',
    isLoggedIn(dbPool),
    getResultStatisticsHandler(dbPool),
  );
  router.get('/:forumQuestionId/funding', isLoggedIn(dbPool), getCalculateFundingHandler(dbPool));
  return router;
}
