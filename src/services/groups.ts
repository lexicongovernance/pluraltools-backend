import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { z } from 'zod';
import { insertGroupsSchema } from '../types/groups';
import { wordlist } from '../utils/db/mnemonics';
import { eq } from 'drizzle-orm';

export function createSecretGroup(
  dbPool: PostgresJsDatabase<typeof db>,
  body: z.infer<typeof insertGroupsSchema>,
) {
  const secret = generateSecret(wordlist, 3);

  const rows = dbPool
    .insert(db.groups)
    .values({
      ...body,
      secret,
    })
    .returning();

  return rows;
}

export function getSecretGroup(dbPool: PostgresJsDatabase<typeof db>, secret: string) {
  const group = dbPool.query.groups.findFirst({
    where: eq(db.groups.secret, secret),
  });

  return group;
}

// Function to generate a random mnemonic
export function generateSecret(wordlist: string[], length: number): string {
  const mnemonicWords: string[] = [];
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * wordlist.length);
    const randomWord = wordlist[randomIndex] as string;
    mnemonicWords.push(randomWord);
  }
  return mnemonicWords.join('-');
}

/**
 * Executes a query to retrieve the members of a group.

 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string} groupId - The ID of the user.
 */
export async function getGroupMembers(dbPool: PostgresJsDatabase<typeof db>, groupId: string) {
  const response = await dbPool.query.groups.findMany({
    where: eq(db.groups.id, groupId),
    with: {
      usersToGroups: {
        with: {
          user: true,
        },
      },
    },
  });

  // Extract user objects from each usersToGroups entry
  const groupMembers = response.flatMap((group) =>
    group.usersToGroups.map((usersToGroup) => {
      const { telegram, createdAt, updatedAt, email, ...userWithoutSensitiveInfo } =
        usersToGroup.user;
      return userWithoutSensitiveInfo;
    }),
  );

  return groupMembers;
}
