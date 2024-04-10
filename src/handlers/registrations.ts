import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';

export function getRegistrationDataHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const registrationId = req.params.id;
    const userId = req.session.userId;
    if (!userId) {
      return res.status(400).json({ errors: ['userId is required'] });
    }

    if (!registrationId) {
      return res.status(400).json({ errors: ['eventId is required'] });
    }

    try {
      const registration = await dbPool.query.registrations.findFirst({
        with: {
          registrationData: true,
        },
        where: (fields, { eq, and }) =>
          and(eq(fields.userId, userId), eq(fields.id, registrationId)),
      });

      const out = registration;

      return res.json({ data: out });
    } catch (e) {
      return res.status(500).json({ errors: ['Failed to get registration data'] });
    }
  };
}
