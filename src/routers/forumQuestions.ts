import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { getQuestionHearts } from '../services/forumQuestions';
import { isLoggedIn } from '../middleware/isLoggedIn';
const router = express.Router();

export function forumQuestionsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/:forumQuestionId/question-hearts', isLoggedIn(), getQuestionHearts(dbPool));
  return router;
}
