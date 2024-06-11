import type * as db from '../db';
import { default as express } from 'express';
import { destroySessionHandler, verifyPCDHandler } from '../handlers/auth';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
const router = express.Router();

export function authRouter({ dbPool }: { dbPool: NodePgDatabase<typeof db> }) {
  router.post('/zupass/verify', verifyPCDHandler(dbPool));
  router.post('/logout', destroySessionHandler());
  return router;
}
