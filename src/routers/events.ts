import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { getEvent, getEvents } from '../services/events';
import { getRegistration, saveRegistration } from '../services/registrations';
import { getRegistrationFields } from '../services/registrationFields';
import { getRegistrationData } from '../services/registrationData';
import { getEventCycles } from '../services/cycles';
const router = express.Router();

export function eventsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', isLoggedIn(), getEvents(dbPool));
  router.get('/:eventId', isLoggedIn(), getEvent(dbPool));
  router.get('/:eventId/registration-fields', isLoggedIn(), getRegistrationFields(dbPool));
  router.get('/:eventId/registration-data', isLoggedIn(), getRegistrationData(dbPool));
  router.post('/:eventId/registration', isLoggedIn(), saveRegistration(dbPool));
  router.get('/:eventId/registration', isLoggedIn(), getRegistration(dbPool));
  router.get('/:eventId/cycles', isLoggedIn(), getEventCycles(dbPool));
  return router;
}
