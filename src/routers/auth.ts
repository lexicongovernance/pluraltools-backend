import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as db from '../db';
import { default as express } from 'express';
import { destroySessionHandler, verifyPCDHandler } from '../handlers/auth';
const router = express.Router();

export function authRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.post('/zupass/verify', verifyPCDHandler(dbPool));
  router.post('/logout', destroySessionHandler());
  return router;
}
