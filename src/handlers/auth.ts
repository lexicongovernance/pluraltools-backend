import type { Request, Response } from 'express';
import { SemaphoreSignaturePCDPackage } from '@pcd/semaphore-signature-pcd';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { createOrSignInPCD } from '../services/auth';
import { verifyUserSchema } from '../types';

export function destroySessionHandler() {
  return function (req: Request, res: Response) {
    req.session.destroy();
    return res.status(204).clearCookie('forum_app_cookie', { path: '/' }).send();
  };
}

export function verifyPCDHandler(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    try {
      const body = verifyUserSchema.safeParse(req.body);

      if (!body.success) {
        console.error(`[ERROR] ${body.error.errors}`);
        res.status(400).send({
          errors: body.error.errors,
        });
        return;
      }

      const pcd = await SemaphoreSignaturePCDPackage.deserialize(body.data.pcd);

      const isVerified = await SemaphoreSignaturePCDPackage.verify(pcd);

      if (!isVerified) {
        console.error(`[ERROR] ZK ticket PCD is not valid`);
        res.status(401).send();
        return;
      }

      const pcdUUID = JSON.parse(pcd.claim.signedMessage) as {
        uuid: string;
        referrer: string;
      };

      if (pcdUUID.uuid !== body.data.uuid) {
        console.error(`[ERROR] UUID does not match`);
        res.status(401).send();
        return;
      }

      try {
        const user = await createOrSignInPCD(dbPool, {
          uuid: body.data.uuid,
          email: body.data.email,
        });

        req.session.userId = user.id;
        await req.session.save();
        return res.status(200).send({ data: user });
      } catch (e) {
        console.error(`[ERROR] ${e}`);
        res.status(401).send();
        return;
      }
    } catch (error: unknown) {
      console.error(`[ERROR] unknown error ${error}`);
      return res.sendStatus(500).send();
    }
  };
}
