import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as db from '../db';
import { default as express } from 'express';
import { ironSession } from 'iron-session/express';
import { authRouter } from './auth';
import cors from 'cors';
import { usersRouter } from './users';

const router = express.Router();

declare module 'iron-session' {
  interface IronSessionData {
    nonce: string;
    userId: string;
  }
}

export function apiRouter({ dbPool }: { dbPool: PostgresJsDatabase<typeof db> }) {
  // setup
  router.use(express.json());
  router.use(express.urlencoded({ extended: true }));
  router.use(cors({ origin: true, credentials: true }));
  router.use(
    ironSession({
      ttl: 1209600, // Expiry: 14 days.
      cookieName: 'forum_app_cookie',
      password: '0001020304050607080900010203040506070809000102030405060708090001',
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
      },
    })
  );
  // routes
  router.use('/auth', authRouter({ dbPool }));
  router.use('/users', usersRouter({ dbPool }));

  return router;
}
