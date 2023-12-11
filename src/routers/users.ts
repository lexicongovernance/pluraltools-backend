import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { getUser } from '../services/users';
const router = express.Router();

export function usersRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', getUser(dbPool));

  return router;
}
