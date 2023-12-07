import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as db from '../db';
import { default as express } from 'express';
import { createNonce, verifyNonce } from '../services/auth/zupass';
const router = express.Router();

export function authRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/zupass/nonce', createNonce(dbPool));
  router.post('/zupass/verify', verifyNonce(dbPool));

  return router;
}
