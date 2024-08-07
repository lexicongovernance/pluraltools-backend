import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { and, eq } from 'drizzle-orm';

export async function checkAccessRules(
  dbPool: NodePgDatabase<typeof schema>,
  data: { provider: string; subject: string },
) {
  const whiteListEntry = await dbPool
    .select()
    .from(schema.accessRules)
    .where(
      and(
        eq(schema.accessRules.provider, data.provider),
        eq(schema.accessRules.subject, data.subject),
      ),
    )
    .limit(1);

  if (whiteListEntry.length > 0) {
    return true;
  }

  // check if there is a whitelist
  const whiteListRows = await dbPool.select().from(schema.accessRules).limit(1);

  if (whiteListRows.length > 0) {
    return false;
  }

  // check if there is a black list
  const blackListEntry = await dbPool
    .select()
    .from(schema.accessRules)
    .where(
      and(
        eq(schema.accessRules.provider, data.provider),
        eq(schema.accessRules.subject, data.subject),
      ),
    )
    .limit(1);

  if (blackListEntry.length > 0) {
    return false;
  }

  return true;
}
