import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { checkAccessRules } from './access-rules';

export async function createOrSignInPCD(
  dbPool: NodePgDatabase<typeof schema>,
  data: { uuid: string; email: string },
): Promise<schema.User> {
  const isAllowed = await checkAccessRules(dbPool, {
    provider: 'zupass',
    subject: data.uuid,
  });

  if (!isAllowed) {
    throw new Error('Access denied');
  }

  // check if there is a federated credential with the same subject
  const federatedCredential: schema.FederatedCredential[] = await dbPool
    .select()
    .from(schema.federatedCredentials)
    .where(eq(schema.federatedCredentials.subject, data.uuid));

  if (federatedCredential.length === 0) {
    // create user
    try {
      const user: schema.User[] = await dbPool
        .insert(schema.users)
        .values({
          email: data.email,
        })
        .returning();

      if (!user[0]?.id) {
        throw new Error('Failed to create user');
      }

      await dbPool.insert(schema.federatedCredentials).values({
        userId: user[0]?.id,
        provider: 'zupass',
        subject: data.uuid,
      });

      return user[0];
    } catch (error: unknown) {
      // repeated subject_provider unique key
      logger.error(`error creating user: ${error}`);
      throw new Error('User already exists');
    }
  } else {
    if (!federatedCredential[0]) {
      throw new Error('expected federated credential to exist');
    }
    const user = await dbPool.query.users.findFirst({
      where: eq(schema.users.id, federatedCredential[0].userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

export async function createOrSignInSIWE(
  dbPool: NodePgDatabase<typeof schema>,
  data: { chainId: string; address: string },
): Promise<schema.User> {
  const isAllowed = await checkAccessRules(dbPool, {
    provider: 'ethereum',
    subject: `${data.chainId}:${data.address}`,
  });

  if (!isAllowed) {
    throw new Error('Access denied');
  }

  // check if there is a federated credential with the same subject
  const federatedCredential: schema.FederatedCredential[] = await dbPool
    .select()
    .from(schema.federatedCredentials)
    .where(eq(schema.federatedCredentials.subject, `${data.chainId}:${data.address}`));

  if (federatedCredential.length === 0) {
    // create user
    try {
      const user: schema.User[] = await dbPool.insert(schema.users).values({}).returning();

      if (!user[0]?.id) {
        throw new Error('Failed to create user');
      }

      await dbPool.insert(schema.federatedCredentials).values({
        userId: user[0]?.id,
        provider: 'ethereum',
        subject: `${data.chainId}:${data.address}`,
      });

      return user[0];
    } catch (error: unknown) {
      // repeated subject_provider unique key
      logger.error(`error creating user: ${error}`);
      throw new Error('User already exists');
    }
  } else {
    if (!federatedCredential[0]) {
      throw new Error('expected federated credential to exist');
    }
    const user = await dbPool.query.users.findFirst({
      where: eq(schema.users.id, federatedCredential[0].userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
