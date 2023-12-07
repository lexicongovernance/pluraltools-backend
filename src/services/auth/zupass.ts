import type { Request, Response } from 'express';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as db from '../../db';
import { getRandomValues, hexToBigInt, toHexString } from '@pcd/util';

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

      res.status(200).send(req.session.ticket);
    } catch (error: any) {
      console.error(`[ERROR] ${error.message}`);

      res.sendStatus(500);
    }
  };
}
