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
  router.get('/', isLoggedIn(dbPool), getEvents(dbPool));
  router.get('/:eventId', isLoggedIn(dbPool), getEvent(dbPool));
  router.get('/:eventId/registration-fields', isLoggedIn(dbPool), getRegistrationFields(dbPool));
  router.get('/:eventId/registration-data', isLoggedIn(dbPool), getRegistrationData(dbPool));
  router.post('/:eventId/registration', isLoggedIn(dbPool), saveRegistration(dbPool));
  router.get('/:eventId/registration', isLoggedIn(dbPool), getRegistration(dbPool));
  router.get('/:eventId/cycles', isLoggedIn(dbPool), getEventCycles(dbPool));
  return router;
}
