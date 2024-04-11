import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { z } from 'zod';
import { insertGroupsSchema } from '../types/groups';
import { randomBytes } from 'crypto';

export function createSecretGroup(
  dbPool: PostgresJsDatabase<typeof db>,
  body: z.infer<typeof insertGroupsSchema>,
) {
  const secret = generateSecret();

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

export function generateSecret(): string {
  return randomBytes(6).toString('hex');
}
