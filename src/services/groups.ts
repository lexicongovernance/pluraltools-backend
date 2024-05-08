import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { z } from 'zod';
import { insertGroupsSchema } from '../types/groups';
import { wordlist } from '../utils/db/mnemonics';

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
    where: (fields, { eq }) => eq(fields.secret, secret),
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
