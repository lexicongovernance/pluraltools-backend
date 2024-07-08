import type { Request, Response } from 'express';
import * as db from '../db';
import { insertRegistrationSchema } from '../types';
import {
  saveRegistration,
  updateRegistration,
  getUserRegistration,
} from '../services/registrations';
import { isUserIsPartOfGroup } from '../services/groups';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { validateEventFields } from '../services/events';

export function getRegistrationDataHandler(dbPool: NodePgDatabase<typeof db>) {
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
        where: eq(db.registrations.id, registrationId),
      });

      const out = [...(registration?.registrationData ?? [])];

      return res.json({ data: out });
    } catch (e) {
      return res.status(500).json({ errors: ['Failed to get registration data'] });
    }
  };
}

export function saveRegistrationHandler(dbPool: NodePgDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const userId = req.session.userId;
    req.body.userId = userId;
    const body = insertRegistrationSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({ errors: body.error.issues });
    }

    const brokenRules = await validateEventFields({
      dbPool,
      registration: body.data,
    });

    if (brokenRules.length > 0) {
      return res.status(400).json({ errors: brokenRules });
    }

    const canRegisterGroup = await isUserIsPartOfGroup({
      dbPool,
      userId,
      groupId: body.data.groupId,
    });

    if (!canRegisterGroup) {
      return res.status(400).json({ errors: ['Can not register for this group'] });
    }

    try {
      const out = await saveRegistration(dbPool, body.data);
      return res.json({ data: out });
    } catch (e) {
      console.log('error saving registration ' + e);
      return res.sendStatus(500);
    }
  };
}

export function updateRegistrationHandler(dbPool: NodePgDatabase<typeof db>) {
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

    const brokenRules = await validateEventFields({
      dbPool,
      registration: body.data,
    });

    if (brokenRules.length > 0) {
      return res.status(400).json({ errors: brokenRules });
    }

    const existingRegistration = await getUserRegistration({
      dbPool,
      registrationId,
      userId,
    });

    if (!existingRegistration) {
      return res.status(400).json({ errors: ['Can not update this registration'] });
    }

    try {
      const out = await updateRegistration({
        data: body.data,
        registration: existingRegistration,
        dbPool,
      });
      return res.json({ data: out });
    } catch (e) {
      console.log('error saving registration ' + e);
      return res.sendStatus(500);
    }
  };
}
