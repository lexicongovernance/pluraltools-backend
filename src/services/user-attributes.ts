import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { and, eq, inArray } from 'drizzle-orm';

export async function upsertUserAttributes(
  dbPool: PostgresJsDatabase<typeof db>,
  userId: string,
  // key -> value pairs
  userAttributes: { [key: string]: string },
) {
  const existingUserAttributes = await dbPool.query.userAttributes.findMany({
    where: and(
      eq(db.userAttributes.userId, userId),
      inArray(db.userAttributes.attributeKey, Object.keys(userAttributes)),
    ),
  });

  // update existing user attributes
  const updatedUserAttributes = [];
  for (const userAttribute of existingUserAttributes) {
    const attributeValue = userAttributes[userAttribute.attributeKey];
    const updatedUserAttribute = await dbPool
      .update(db.userAttributes)
      .set({
        attributeValue,
      })
      .where(
        and(
          eq(db.userAttributes.userId, userId),
          eq(db.userAttributes.attributeKey, userAttribute.attributeKey),
        ),
      )
      .returning();
    updatedUserAttributes.push(updatedUserAttribute);
  }

  // insert new user attributes
  const newUserAttributes = [];
  for (const [key, value] of Object.entries(userAttributes)) {
    if (!existingUserAttributes.find((ua) => ua.attributeKey === key)) {
      const newUserAttribute = await dbPool
        .insert(db.userAttributes)
        .values({
          userId,
          attributeKey: key,
          attributeValue: value,
        })
        .returning();
      newUserAttributes.push(newUserAttribute);
    }
  }

  return updatedUserAttributes.concat(newUserAttributes);
}
