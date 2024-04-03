import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq } from 'drizzle-orm';

export async function createOrSignInPCD(
  dbPool: PostgresJsDatabase<typeof db>,
  data: { uuid: string; email: string },
): Promise<db.User> {
  // check if there is a federated credential with the same subject
  const federatedCredential: db.FederatedCredential[] = await dbPool
    .select()
    .from(db.federatedCredentials)
    .where(eq(db.federatedCredentials.subject, data.uuid));

  if (federatedCredential.length === 0) {
    // create user
    try {
      const user: db.User[] = await dbPool
        .insert(db.users)
        .values({
          email: data.email,
        })
        .returning();

      if (!user[0]?.id) {
        throw new Error('Failed to create user');
      }

      await dbPool.insert(db.federatedCredentials).values({
        userId: user[0]?.id,
        provider: 'zupass',
        subject: data.uuid,
      });

      return user[0];
    } catch (error: unknown) {
      // repeated subject_provider unique key
      console.error(`[ERROR] ${error}`);
      throw new Error('User already exists');
    }
  } else {
    if (!federatedCredential[0]) {
      throw new Error('expected federated credential to exist');
    }
    const user = await dbPool.query.users.findFirst({
      where: eq(db.users.id, federatedCredential[0].userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
