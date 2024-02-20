import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as db from '../db';
import { default as express } from 'express';
import { ironSession } from 'iron-session/express';
import { authRouter } from './auth';
import cors from 'cors';
import { usersRouter } from './users';
import { cyclesRouter } from './cycles';
import { eventsRouter } from './events';
import { forumQuestionsRouter } from './forumQuestions';
import { groupsRouter } from './groups';
import { commentsRouter } from './comments';
import { optionsRouter } from './options';

const router = express.Router();

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
  dbPool: PostgresJsDatabase<typeof db>;
  cookiePassword: string;
}) {
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
  // routes
  router.use('/auth', authRouter({ dbPool }));
  router.use('/users', usersRouter({ dbPool }));
  router.use('/cycles', cyclesRouter({ dbPool }));
  router.use('/events', eventsRouter({ dbPool }));
  router.use('/forum-questions', forumQuestionsRouter({ dbPool }));
  router.use('/groups', groupsRouter({ dbPool }));
  router.use('/comments', commentsRouter({ dbPool }));
  router.use('/options', optionsRouter({ dbPool }));

  return router;
}
