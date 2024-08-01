import { default as express } from 'express';
import type * as schema from '../db/schema';
import { isLoggedIn } from '../middleware/is-logged-in';
import {
  getEventCyclesHandler,
  getEventGroupCategoriesHandler,
  getEventHandler,
  getEventNavLinksHandler,
  getEventRegistrationFieldsHandler,
  getEventRegistrationsHandler,
  getEventsHandler,
} from '../handlers/events';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
const router = express.Router();

export function eventsRouter({ dbPool }: { dbPool: NodePgDatabase<typeof schema> }) {
  router.get('/', isLoggedIn(dbPool), getEventsHandler(dbPool));
  router.get('/:eventId', isLoggedIn(dbPool), getEventHandler(dbPool));
  router.get(
    '/:eventId/group-categories',
    isLoggedIn(dbPool),
    getEventGroupCategoriesHandler(dbPool),
  );
  router.get(
    '/:eventId/registration-fields',
    isLoggedIn(dbPool),
    getEventRegistrationFieldsHandler(dbPool),
  );
  router.get('/:eventId/cycles', isLoggedIn(dbPool), getEventCyclesHandler(dbPool));
  router.get('/:eventId/nav-links', isLoggedIn(dbPool), getEventNavLinksHandler(dbPool));
  router.get('/:eventId/registrations', isLoggedIn(dbPool), getEventRegistrationsHandler(dbPool));
  return router;
}
