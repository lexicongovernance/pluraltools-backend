import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { getEvents, getRegistrationData, getRegistrationFields } from '../services/events';
import { saveRegistration } from '../services/registrations';
const router = express.Router();

export function eventsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', isLoggedIn(), getEvents(dbPool));
  router.get('/:eventId/registration-fields', isLoggedIn(), getRegistrationFields(dbPool));
  router.get('/:eventId/registration-data', isLoggedIn(), getRegistrationData(dbPool));
  router.post('/:eventId/registration-data', isLoggedIn(), saveRegistration(dbPool));
  return router;
}
