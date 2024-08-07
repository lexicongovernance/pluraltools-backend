import type * as schema from '../db/schema';
import { default as express } from 'express';
import {
  destroySessionHandler,
  getSIWENonceHandler,
  getSIWESessionHandler,
  verifyPCDHandler,
  verifySIWEHandler,
} from '../handlers/auth';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
const router = express.Router();

export function authRouter({ dbPool }: { dbPool: NodePgDatabase<typeof schema> }) {
  router.post('/zupass/verify', verifyPCDHandler(dbPool));
  router.get('/siwe/nonce', getSIWENonceHandler());
  router.post('/siwe/verify', verifySIWEHandler(dbPool));
  router.get('/siwe/session', getSIWESessionHandler(dbPool));
  router.post('/logout', destroySessionHandler());
  return router;
}
