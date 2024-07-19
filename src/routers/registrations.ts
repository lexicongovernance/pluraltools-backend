import { default as express } from 'express';
import type * as schema from '../db/schema';
import { isLoggedIn } from '../middleware/is-logged-in';
import {
  getRegistrationDataHandler,
  saveRegistrationHandler,
  updateRegistrationHandler,
} from '../handlers/registrations';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

const router = express.Router();

export function registrationsRouter({ dbPool }: { dbPool: NodePgDatabase<typeof schema> }) {
  router.post('/', isLoggedIn(dbPool), saveRegistrationHandler(dbPool));
  router.put('/:id', isLoggedIn(dbPool), updateRegistrationHandler(dbPool));
  router.get('/:id/registration-data', isLoggedIn(dbPool), getRegistrationDataHandler(dbPool));

  return router;
}
