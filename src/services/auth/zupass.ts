import { SemaphoreSignaturePCDPackage } from '@pcd/semaphore-signature-pcd';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request, Response } from 'express';
import * as db from '../../db';
import { eq } from 'drizzle-orm';
import { verifyUserSchema } from '../../types';

export function verifyPCD(dbPool: PostgresJsDatabase<typeof db>) {
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

      // check if there is a federated credential with the same subject
      const federatedCredential: db.FederatedCredential[] = await dbPool
        .select()
        .from(db.federatedCredentials)
        .where(eq(db.federatedCredentials.subject, body.data.uuid));

      if (federatedCredential.length === 0) {
        // create user
        try {
          const user: db.User[] = await dbPool
            .insert(db.users)
            .values({
              email: body.data.email,
            })
            .returning();

          if (!user[0]?.id) {
            throw new Error('Failed to create user');
          }

          await dbPool.insert(db.federatedCredentials).values({
            userId: user[0]?.id,
            provider: 'zupass',
            subject: body.data.uuid,
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
          where: eq(db.users.id, federatedCredential[0].userId),
        });
        req.session.userId = federatedCredential[0]?.userId ?? '';
        await req.session.save();
        return res.status(200).json({ data: user });
      }
    } catch (error: unknown) {
      console.error(`[ERROR] unknown error ${error}`);
      return res.sendStatus(500).send();
    }
  };
}
