import type * as schema from '../db/schema';
import { default as express } from 'express';
import { destroySessionHandler, verifyPCDHandler } from '../handlers/auth';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
const router = express.Router();

export function authRouter({ dbPool }: { dbPool: NodePgDatabase<typeof schema> }) {
  router.post('/zupass/verify', verifyPCDHandler(dbPool));
  router.post('/logout', destroySessionHandler());
  return router;
}
