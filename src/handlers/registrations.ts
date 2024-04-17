import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../db';
import { insertRegistrationSchema } from '../types';
import { validateRequiredRegistrationFields } from '../services/registrationFields';
import {
  saveRegistration,
  updateRegistration,
  validateCreateRegistrationPermissions,
  validateUpdateRegistrationPermissions,
} from '../services/registrations';
import { and, eq } from 'drizzle-orm';

export function getRegistrationDataHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const registrationId = req.params.id;
    const userId = req.session.userId;
    if (!userId) {
      return res.status(400).json({ errors: ['userId is required'] });
    }

    if (!registrationId) {
      return res.status(400).json({ errors: ['registrationId is required'] });
    }

    try {
      const registration = await dbPool.query.registrations.findFirst({
        with: {
          registrationData: true,
        },
        where: and(eq(db.registrations.userId, userId), eq(db.registrations.id, registrationId)),
      });

      const out = [...(registration?.registrationData ?? [])];

      return res.json({ data: out });
    } catch (e) {
      return res.status(500).json({ errors: ['Failed to get registration data'] });
    }
  };
}

export function saveRegistrationHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const userId = req.session.userId;
    req.body.userId = userId;
    const body = insertRegistrationSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({ errors: body.error.issues });
    }

    const missingRequiredFields = await validateRequiredRegistrationFields(dbPool, body.data);

    if (missingRequiredFields.length > 0) {
      return res.status(400).json({ errors: missingRequiredFields });
    }

    const canRegisterGroup = await validateCreateRegistrationPermissions({
      dbPool,
      userId,
      eventId: body.data.eventId,
      groupId: body.data.groupId,
    });

    if (!canRegisterGroup) {
      return res.status(400).json({ errors: ['Cannot register for this group'] });
    }

    try {
      const out = await saveRegistration(dbPool, body.data, userId);
      return res.json({ data: out });
    } catch (e) {
      console.log('error saving registration ' + e);
      return res.sendStatus(500);
    }
  };
}

export function updateRegistrationHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const registrationId = req.params.id;

    if (!registrationId) {
      return res.status(400).json({ errors: ['registrationId is required'] });
    }

    const userId = req.session.userId;
    req.body.userId = userId;
    const body = insertRegistrationSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({ errors: body.error.issues });
    }

    const missingRequiredFields = await validateRequiredRegistrationFields(dbPool, body.data);

    if (missingRequiredFields.length > 0) {
      return res.status(400).json({ errors: missingRequiredFields });
    }

    const canUpdateRegistration = await validateUpdateRegistrationPermissions({
      dbPool,
      registrationId,
      userId,
      groupId: body.data.groupId,
    });

    if (!canUpdateRegistration) {
      return res.status(400).json({ errors: ['Cannot update this registration'] });
    }

    try {
      const out = await updateRegistration({
        data: body.data,
        dbPool,
        registrationId,
        userId,
      });
      return res.json({ data: out });
    } catch (e) {
      console.log('error saving registration ' + e);
      return res.sendStatus(500);
    }
  };
}
