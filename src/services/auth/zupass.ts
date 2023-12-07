import type { Request, Response } from 'express';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as db from '../../db';
import { getRandomValues, hexToBigInt, toHexString } from '@pcd/util';
import { SemaphoreSignaturePCDPackage } from '@pcd/semaphore-signature-pcd';

export function createNonce() {
  return async function (req: Request, res: Response) {
    try {
      req.session.nonce = hexToBigInt(toHexString(getRandomValues(30))).toString();
      await req.session.save();
      return res.json({ nonce: req.session.nonce });
    } catch (error) {
      console.error(`[ERROR] ${error}`);

      res.send(500);
    }
  };
}

export function verifyNonce(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    try {
      if (!req.body.pcd) {
        console.error(`[ERROR] No PCD specified`);

        res.status(400).send();
        return;
      }
      const pcd = await SemaphoreSignaturePCDPackage.deserialize(req.body.pcd);
      console.log('@here', pcd);
      const isVerified = await SemaphoreSignaturePCDPackage.verify(pcd);
      console.log('@here 1');
      if (!isVerified) {
        console.error(`[ERROR] ZK ticket PCD is not valid`);

        res.status(401).send();
        return;
      }
      console.log('@here 2', req.session.nonce);
      if (pcd.claim.signedMessage !== req.session.nonce) {
        console.error(`[ERROR] PCD nonce doesn't match`);

        res.status(401).send();
        return;
      }

      // create user
      await req.session.save();
      console.log('@here 3');
      return res.status(200).send('OK');
    } catch (error: any) {
      console.error(`[ERROR] ${JSON.stringify(error)}`);
      return res.sendStatus(500);
    }
  };
}
