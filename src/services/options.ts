import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { fieldsSchema, insertOptionsSchema } from '../types';
import * as schema from '../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { enforceRules } from './validation';

export async function getUserOption({
  dbPool,
  optionId,
  userId,
}: {
  dbPool: NodePgDatabase<typeof schema>;
  userId: string;
  optionId: string;
}): Promise<schema.Option | null> {
  const existingOption = await dbPool.query.options.findFirst({
    where: and(eq(schema.options.userId, userId), eq(schema.options.id, optionId)),
  });

  if (!existingOption) {
    return null;
  }

  return existingOption;
}

export async function saveOption(
  dbPool: NodePgDatabase<typeof schema>,
  data: z.infer<typeof insertOptionsSchema>,
) {
  const newOption = await createOptionInDB(dbPool, {
    ...data,
  });

  if (!newOption) {
    throw new Error('failed to save option');
  }

  return newOption;
}

export async function updateOption({
  data,
  dbPool,
  option,
}: {
  dbPool: NodePgDatabase<typeof schema>;
  data: z.infer<typeof insertOptionsSchema>;
  option: schema.Option;
}) {
  const updatedRegistration = await updateOptionInDB(dbPool, option, data);

  if (!updatedRegistration) {
    throw new Error('failed to save option');
  }

  const out = {
    ...updatedRegistration,
  };

  return out;
}

async function createOptionInDB(
  dbPool: NodePgDatabase<typeof schema>,
  body: z.infer<typeof insertOptionsSchema>,
) {
  const rows = await dbPool
    .insert(schema.options)
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
  dbPool: NodePgDatabase<typeof schema>,
  option: schema.Option,
  body: z.infer<typeof insertOptionsSchema>,
) {
  const rows = await dbPool
    .update(schema.options)
    .set({
      groupId: body.groupId,
      questionId: body.questionId,
      data: body.data,
      title: body.title,
      subTitle: body.subTitle,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.options.id, option.id)))
    .returning();
  return rows[0];
}

export async function validateOptionData({
  option,
  dbPool,
}: {
  dbPool: NodePgDatabase<typeof schema>;
  option: z.infer<typeof insertOptionsSchema>;
}) {
  const rows = await dbPool
    .select()
    .from(schema.questions)
    .where(eq(schema.questions.id, option.questionId));

  if (!rows.length) {
    return [];
  }

  const question = rows[0];

  if (!question) {
    return [];
  }

  // get registration fields for the event
  const questionFields = fieldsSchema.safeParse(question.fields);

  if (!questionFields.success) {
    return [];
  }

  return enforceRules({
    data: option.data,
    fields: questionFields.data,
  });
}

export async function canUserCreateOption({
  option,
  dbPool,
}: {
  dbPool: NodePgDatabase<typeof schema>;
  option: z.infer<typeof insertOptionsSchema>;
}): Promise<boolean> {
  const rows = await dbPool
    .select()
    .from(schema.questions)
    .where(eq(schema.questions.id, option.questionId));

  if (!rows.length) {
    return false;
  }

  const question = rows[0];

  if (!question) {
    return false;
  }

  return !!question.userCanCreate;
}
