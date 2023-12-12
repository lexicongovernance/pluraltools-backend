import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as db from '../db';
import { default as express } from 'express';
import { createNonce, verifyNonce } from '../services/auth/zupass';
import { destroySession } from '../services/auth';
const router = express.Router();

export function authRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/zupass/nonce', createNonce());
  router.post('/zupass/verify', verifyNonce(dbPool));
  router.post('/logout', destroySession());
  return router;
}
