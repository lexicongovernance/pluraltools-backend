import * as db from '../db';
import { z } from 'zod';
import { insertGroupsSchema } from '../types/groups';
import { wordlist } from '../utils/db/mnemonics';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export function createSecretGroup(
  dbPool: NodePgDatabase<typeof db>,
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

export function getSecretGroup(dbPool: NodePgDatabase<typeof db>, secret: string) {
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

 * @param { NodePgDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string} groupId - The ID of the user.
 */
export async function getGroupMembers(dbPool: NodePgDatabase<typeof db>, groupId: string) {
  const response = await dbPool.query.groups.findMany({
    where: eq(db.groups.id, groupId),
    with: {
      usersToGroups: {
        with: {
          user: {
            columns: {
              telegram: false,
              createdAt: false,
              updatedAt: false,
              email: false,
            },
          },
        },
      },
    },
  });

  const out = response[0]?.usersToGroups.map((userToGroup) => userToGroup.user);

  return out;
}

/**
 * Executes a query to retrieve the registrations of a group.

 * @param { NodePgDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string} groupId - The ID of the user.
 */
export async function getGroupRegistrations(dbPool: NodePgDatabase<typeof db>, groupId: string) {
  const response = await dbPool.query.groups.findMany({
    where: eq(db.groups.id, groupId),
    columns: {
      secret: false,
    },
    with: {
      registrations: {
        with: {
          registrationData: {
            with: {
              registrationField: true,
            },
          },
        },
      },
    },
  });

  return response;
}
