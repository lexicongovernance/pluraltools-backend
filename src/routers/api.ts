import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../db/schema';
import { default as express } from 'express';
import { ironSession } from 'iron-session/express';
import { authRouter } from './auth';
import cors from 'cors';
import { usersRouter } from './users';
import { cyclesRouter } from './cycles';
import { eventsRouter } from './events';
import { forumQuestionsRouter } from './questions';
import { groupsRouter } from './groups';
import { commentsRouter } from './comments';
import { optionsRouter } from './options';
import { votesRouter } from './votes';
import { registrationsRouter } from './registrations';
import { usersToGroupsRouter } from './users-to-groups';
import { groupCategoriesRouter } from './group-categories';
import { navLinksRouter } from './nav-links';
import { pinoHttp } from 'pino-http';
import { logger } from '../utils/logger';
import type { Request } from 'express';

declare module 'iron-session' {
  interface IronSessionData {
    nonce: string;
    userId: string;
  }
}

export function apiRouter({
  dbPool,
  cookiePassword,
}: {
  dbPool: NodePgDatabase<typeof schema>;
  cookiePassword: string;
}) {
  const router = express.Router();
  // setup
  router.use(express.json());
  router.use(express.urlencoded({ extended: true }));
  router.use(cors({ origin: true, credentials: true }));
  router.use(
    ironSession({
      ttl: 1209600, // Expiry: 14 days.
      cookieName: 'forum_app_cookie',
      password: cookiePassword,
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      },
    }),
  );
  const middlewareLogger = pinoHttp({
    logger: logger,
    genReqId: (req: Request) => req.session.userId,
    level: process.env.LOG_LEVEL || 'info',
  });
  router.use(middlewareLogger);
  // routes
  router.use('/auth', authRouter({ dbPool }));
  router.use('/users', usersRouter({ dbPool }));
  router.use('/cycles', cyclesRouter({ dbPool }));
  router.use('/votes', votesRouter({ dbPool }));
  router.use('/events', eventsRouter({ dbPool }));
  router.use('/questions', forumQuestionsRouter({ dbPool }));
  router.use('/groups', groupsRouter({ dbPool }));
  router.use('/comments', commentsRouter({ dbPool }));
  router.use('/options', optionsRouter({ dbPool }));
  router.use('/group-categories', groupCategoriesRouter({ dbPool }));
  router.use('/registrations', registrationsRouter({ dbPool }));
  router.use('/users-to-groups', usersToGroupsRouter({ dbPool }));
  router.use('/nav-links', navLinksRouter({ dbPool }));

  return router;
}
