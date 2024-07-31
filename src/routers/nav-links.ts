import { default as express } from 'express';
import type * as schema from '../db/schema';
import { getActiveNavLinks } from '../handlers/nav-links';
import { isLoggedIn } from '../middleware/is-logged-in';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
const router = express.Router();

export function navLinksRouter({ dbPool }: { dbPool: NodePgDatabase<typeof schema> }) {
  router.get('/', isLoggedIn(dbPool), getActiveNavLinks(dbPool));
  return router;
}
