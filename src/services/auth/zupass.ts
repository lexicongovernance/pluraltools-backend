import { SemaphoreSignaturePCDPackage } from '@pcd/semaphore-signature-pcd';
import { getRandomValues, hexToBigInt, toHexString } from '@pcd/util';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import type * as db from '../../db';
import { users } from '../../db';
import { federatedCredentials, type FederatedCredential } from '../../db/federatedCredentials';
import { eq } from 'drizzle-orm';

export function createNonce() {
  return async function (req: Request, res: Response) {
    try {
      req.session.nonce = hexToBigInt(toHexString(getRandomValues(30))).toString();
      await req.session.save();
      return res.json({ data: req.session.nonce });
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

      const isVerified = await SemaphoreSignaturePCDPackage.verify(pcd);

      if (!isVerified) {
        console.error(`[ERROR] ZK ticket PCD is not valid`);
        res.status(401).send();
        return;
      }

      if (pcd.claim.signedMessage !== req.session.nonce) {
        console.error(`[ERROR] PCD nonce doesn't match`);

        res.status(401).send();
        return;
      }

      // create federated credential
      const federatedCredential: FederatedCredential[] = await dbPool
        .select()
        .from(federatedCredentials)
        .where(eq(federatedCredentials.subject, pcd.claim.identityCommitment));

      if (federatedCredential.length === 0) {
        // create user
        try {
          const user: db.User[] = await dbPool.insert(users).values({}).returning();

          if (!user[0]) {
            throw new Error('Failed to create user');
          }

          await dbPool.insert(federatedCredentials).values({
            userId: user[0]?.id,
            provider: 'zupass',
            subject: pcd.claim.identityCommitment,
          });

          req.session.userId = user[0].id;
          await req.session.save();
          return res.status(200).json({ data: user[0] });
        } catch (error: unknown) {
          // repeated subject_provider unique key
          console.error(`[ERROR] ${error}`);
          return res.status(401).json({ data: 'User already exists' });
        }
      } else {
        if (!federatedCredential[0]) {
          throw new Error('expected federated credential to exist');
        }
        const user = await dbPool.query.users.findFirst({
          where: eq(users.id, federatedCredential[0].userId),
        });
        req.session.userId = federatedCredential[0]?.userId ?? '';
        await req.session.save();
        return res.status(200).json({ data: user });
      }
    } catch (error: unknown) {
      console.error(`[ERROR] ${JSON.stringify(error)}`);
      return res.sendStatus(500).send();
    }
  };
}
