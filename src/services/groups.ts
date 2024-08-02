import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { z } from 'zod';
import * as schema from '../db/schema';
import { insertGroupsSchema } from '../types/groups';
import { wordlist } from '../utils/mnemonics';

export function createSecretGroup(
  dbPool: NodePgDatabase<typeof schema>,
  body: z.infer<typeof insertGroupsSchema>,
) {
  const secret = generateSecret(wordlist, 3);

  const rows = dbPool
    .insert(schema.groups)
    .values({
      ...body,
      secret,
    })
    .returning();

  return rows;
}

export function getSecretGroup(dbPool: NodePgDatabase<typeof schema>, secret: string) {
  const group = dbPool.query.groups.findFirst({
    where: eq(schema.groups.secret, secret),
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
 */
export async function getGroupMembers(dbPool: NodePgDatabase<typeof schema>, groupId: string) {
  const response = await dbPool.query.groups.findMany({
    where: eq(schema.groups.id, groupId),
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
 */
export async function getGroupRegistrations(
  dbPool: NodePgDatabase<typeof schema>,
  groupId: string,
) {
  const response = await dbPool.query.groups.findMany({
    where: eq(schema.groups.id, groupId),
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

export async function isUserIsPartOfGroup({
  dbPool,
  userId,
  groupId,
}: {
  dbPool: NodePgDatabase<typeof schema>;
  userId: string;
  groupId?: string | null;
}) {
  if (groupId) {
    const userGroup = await dbPool.query.usersToGroups.findFirst({
      where: and(
        eq(schema.usersToGroups.userId, userId),
        eq(schema.usersToGroups.groupId, groupId),
      ),
    });

    if (!userGroup) {
      return false;
    }
  }

  return true;
}
