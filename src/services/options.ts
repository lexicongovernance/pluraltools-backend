import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { fieldsSchema, insertOptionsSchema } from '../types';
import * as db from '../db';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { enforceRules } from './validation';

export async function getUserOption({
  dbPool,
  optionId,
  userId,
}: {
  dbPool: NodePgDatabase<typeof db>;
  userId: string;
  optionId: string;
}): Promise<db.Option | null> {
  const existingOption = await dbPool.query.options.findFirst({
    where: and(eq(db.options.userId, userId), eq(db.options.id, optionId)),
  });

  if (!existingOption) {
    return null;
  }

  return existingOption;
}

export async function saveOption(
  dbPool: NodePgDatabase<typeof db>,
  data: z.infer<typeof insertOptionsSchema>,
) {
  const newOption = await createOptionInDB(dbPool, {
    ...data,
  });

  if (!newOption) {
    throw new Error('failed to save registration');
  }

  return newOption;
}

export async function updateOption({
  data,
  dbPool,
  option,
}: {
  dbPool: NodePgDatabase<typeof db>;
  data: z.infer<typeof insertOptionsSchema>;
  option: db.Option;
}) {
  const updatedRegistration = await updateOptionInDB(dbPool, option, data);

  if (!updatedRegistration) {
    throw new Error('failed to save registration');
  }

  const out = {
    ...updatedRegistration,
  };

  return out;
}

async function createOptionInDB(
  dbPool: NodePgDatabase<typeof db>,
  body: z.infer<typeof insertOptionsSchema>,
) {
  const rows = await dbPool
    .insert(db.options)
    .values({
      userId: body.userId,
      questionId: body.questionId,
      title: body.title,
      subTitle: body.subTitle,
      groupId: body.groupId,
      data: body.data,
    })
    .returning();
  return rows[0];
}

async function updateOptionInDB(
  dbPool: NodePgDatabase<typeof db>,
  option: db.Option,
  body: z.infer<typeof insertOptionsSchema>,
) {
  const rows = await dbPool
    .update(db.options)
    .set({
      groupId: body.groupId,
      questionId: body.questionId,
      data: body.data,
      title: body.title,
      subTitle: body.subTitle,
      updatedAt: new Date(),
    })
    .where(and(eq(db.options.id, option.id)))
    .returning();
  return rows[0];
}
