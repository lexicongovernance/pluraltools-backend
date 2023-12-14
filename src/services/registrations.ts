import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import type { Request, Response } from 'express';
import { and, eq, ne } from 'drizzle-orm';
import { insertRegistrationSchema } from '../types';
import { z } from 'zod';

export function saveRegistration(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    // parse input
    const userId = req.session.userId;
    req.body.userId = userId;
    const body = insertRegistrationSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ errors: body.error.issues });
    }

    // check if unique keys are available
    const uniqueValidation = await validateUniqueKeys(dbPool, body.data);

    if (uniqueValidation.errors.email || uniqueValidation.errors.username) {
      return res.status(400).json({ errors: [uniqueValidation.errors] });
    }

    const registration = await dbPool
      .select()
      .from(db.registrations)
      .where(eq(db.registrations.userId, userId));

    if (registration.length > 0 && registration[0]) {
      const updatedRegistration = await dbPool
        .update(db.registrations)
        .set({
          email: body.data.email,
          username: body.data.username,
          proposalAbstract: body.data.proposalAbstract,
          proposalTitle: body.data.proposalTitle,
          status: body.data.status,
          updatedAt: new Date(),
        })
        .where(eq(db.registrations.id, registration[0].id))
        .returning();
      return res.json({ data: updatedRegistration });
    } else {
      // insert to registration table
      const newRegistration = await dbPool.insert(db.registrations).values(body.data).returning();

      return res.json({ data: newRegistration });
    }
  };
}

async function validateUniqueKeys(
  dbPool: PostgresJsDatabase<typeof db>,
  data: z.infer<typeof insertRegistrationSchema>,
): Promise<{ errors: { username?: string; email?: string } }> {
  const res = {
    errors: {
      username: '',
      email: '',
    },
  };

  if (!data.username && !data.email) {
    return res;
  }

  if (data.username) {
    const usernames = await dbPool
      .select()
      .from(db.registrations)
      .where(
        and(eq(db.registrations.username, data.username), ne(db.registrations.userId, data.userId)),
      );

    if (usernames.length > 0) {
      res.errors.username = 'username is already taken';
    }
  }

  if (data.email) {
    const emails = await dbPool
      .select()
      .from(db.registrations)
      .where(and(eq(db.registrations.email, data.email), ne(db.registrations.userId, data.userId)));

    if (emails.length > 0) {
      res.errors.email = 'email is already taken';
    }
  }

  return res;
}
