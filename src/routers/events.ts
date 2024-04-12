import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import {
  getEventCyclesHandler,
  getEventHandler,
  getEventRegistrationFieldsHandler,
  getEventRegistrationsHandler,
  getEventsHandler,
} from '../handlers/events';
const router = express.Router();

export function eventsRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  router.get('/', isLoggedIn(dbPool), getEventsHandler(dbPool));
  router.get('/:eventId', isLoggedIn(dbPool), getEventHandler(dbPool));
  router.get(
    '/:eventId/registration-fields',
    isLoggedIn(dbPool),
    getEventRegistrationFieldsHandler(dbPool),
  );
  router.get('/:eventId/cycles', isLoggedIn(dbPool), getEventCyclesHandler(dbPool));
  router.get('/:eventId/registrations', isLoggedIn(dbPool), getEventRegistrationsHandler(dbPool));
  return router;
}
