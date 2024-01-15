import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { getAggResultsStatistics } from '../services/resultsPage';
import { isLoggedIn } from '../middleware/isLoggedIn';
const router = express.Router();

export function resultsPageRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/:forumQuestionId/agg-statistics', isLoggedIn(), getAggResultsStatistics(dbPool));
  return router;
}
