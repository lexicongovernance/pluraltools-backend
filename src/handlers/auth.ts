import type { Request, Response } from 'express';
import { SemaphoreSignaturePCDPackage } from '@pcd/semaphore-signature-pcd';
import * as schema from '../db/schema';
import { createOrSignInPCD, createOrSignInSIWE } from '../services/auth';
import { verifySIWEUserSchema, verifyZupassUserSchema } from '../types';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { logger } from '../utils/logger';
import { generateNonce, SiweMessage } from 'siwe';
import { eq } from 'drizzle-orm';

export function destroySessionHandler() {
  return function (req: Request, res: Response) {
    req.session.destroy();
    return res.status(204).clearCookie('forum_app_cookie', { path: '/' }).send();
  };
}

export function verifyPCDHandler(dbPool: NodePgDatabase<typeof schema>) {
  return async function (req: Request, res: Response) {
    try {
      const body = verifyZupassUserSchema.safeParse(req.body);

      if (!body.success) {
        logger.error(`[ERROR] ${body.error.errors}`);
        res.status(400).send({
          errors: body.error.errors,
        });
        return;
      }

      const pcd = await SemaphoreSignaturePCDPackage.deserialize(body.data.pcd);

      const isVerified = await SemaphoreSignaturePCDPackage.verify(pcd);

      if (!isVerified) {
        logger.error(`[ERROR] ZK ticket PCD is not valid`);
        res.status(401).send();
        return;
      }

      const pcdUUID = JSON.parse(pcd.claim.signedMessage) as {
        uuid: string;
        referrer: string;
      };

      if (pcdUUID.uuid !== body.data.uuid) {
        logger.error(`[ERROR] UUID does not match`);
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
        logger.error(`[ERROR] ${e}`);
        res.status(401).send();
        return;
      }
    } catch (error: unknown) {
      logger.error(`[ERROR] unknown error ${error}`);
      return res.sendStatus(500).send();
    }
  };
}

export function getSIWENonceHandler() {
  return function (req: Request, res: Response) {
    res.setHeader('Content-Type', 'text/plain');
    const nonce = generateNonce();
    req.session.nonce = nonce;
    res.send(nonce);
  };
}

export function verifySIWEHandler(dbPool: NodePgDatabase<typeof schema>) {
  return async function (req: Request, res: Response) {
    const body = verifySIWEUserSchema.safeParse(req.body);

    if (!body.success) {
      logger.error(`[ERROR] ${body.error.errors}`);
      res.status(400).send({
        errors: body.error.errors,
      });
      return;
    }

    const siweMessage = new SiweMessage(body.data.message);

    try {
      await siweMessage.verify({ signature: body.data.signature, nonce: req.session.nonce });

      // create or sign in user
      try {
        const user = await createOrSignInSIWE(dbPool, {
          address: siweMessage.address,
          chainId: siweMessage.chainId.toString(),
        });

        req.session.userId = user.id;
        await req.session.save();
        return res.status(200).send({ data: user });
      } catch (e) {
        logger.error(`[ERROR] ${e}`);
        res.status(401).send();
        return;
      }
    } catch {
      res.send(false);
    }
  };
}

export function getSIWESessionHandler(dbPool: NodePgDatabase<typeof schema>) {
  return async function (req: Request, res: Response) {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).send();
    }

    const user = await dbPool.query.users.findFirst({
      where: eq(schema.users.id, userId),
      with: {
        federatedCredential: true,
      },
    });

    if (!user) {
      return res.status(401).send();
    }

    const [chaindId, address] = user.federatedCredential?.subject?.split(':') ?? [];

    if (!chaindId || !address) {
      return res.status(401).send();
    }

    return res.status(200).send({
      data: {
        chainId: chaindId,
        address,
      },
    });
  };
}
