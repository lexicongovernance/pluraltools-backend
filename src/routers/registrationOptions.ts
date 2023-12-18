import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { default as express } from 'express';
import type * as db from '../db';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { saveUsersToRegistrationOptions } from '../services/registrationOptions';

const router = express.Router();

export function usersToRegistrationOptionsRouter({
  dbPool,
}: {
  dbPool: PostgresJsDatabase<typeof db>;
}) {
  router.post('/', isLoggedIn(), async (req, res) => {
    const { userId, newRegistrationOptions } = req.body;

    if (!userId || !newRegistrationOptions || !Array.isArray(newRegistrationOptions)) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    try {
      const result = await saveUsersToRegistrationOptions(dbPool, userId, newRegistrationOptions);

      if (result !== null) {
        res.status(200).json({ success: true, data: result });
      } else {
        res.status(500).json({ error: 'Error saving user registration options' });
      }
    } catch (error) {
      console.error('Error saving user registration options:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
}
