import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq, and, isNotNull, inArray } from 'drizzle-orm';
import type { Request, Response } from 'express';

export function getRegistrationData(dbPool: PostgresJsDatabase<typeof db>) {
  return async function (req: Request, res: Response) {
    const eventId = req.params.eventId;
    const userId = req.session.userId;
    console.log({ userId });
    if (!userId) {
      return res.status(400).json({ errors: ['userId is required'] });
    }

    if (!eventId) {
      return res.status(400).json({ errors: ['eventId is required'] });
    }

    const event = await dbPool.query.events.findFirst({
      with: {
        registrations: {
          with: {
            registrationData: true,
          },
          where: (fields, { eq }) => eq(fields.userId, userId),
        },
      },
      where: (fields, { eq }) => eq(fields.id, eventId),
    });

    const out = event?.registrations.map((registration) => registration.registrationData).flat();

    return res.json({ data: out });
  };
}

/**
 * Upserts the registration data for a given registrationId.
 * Updates existing records and inserts new ones if necessary.
 * @param dbPool - The database pool instance of type `PostgresJsDatabase<typeof db>`.
 * @param registrationId - The ID of the registration to overwrite data for.
 * @param registrationData - An array of objects representing registration data.
 *   Each object should have the properties:
 *   - registrationFieldId: The identifier for the registration field associated with the data.
 *   - value: The value of the registration data.
 * @returns A Promise that resolves to the updated registration data or null if an error occurs.
 */
export async function upsertRegistrationData({
  dbPool,
  registrationData,
  registrationId,
}: {
  dbPool: PostgresJsDatabase<typeof db>;
  registrationId: string;
  registrationData: {
    registrationFieldId: string;
    value: string;
  }[];
}): Promise<db.RegistrationData[] | null> {
  try {
    const updatedRegistrationData: db.RegistrationData[] = [];

    for (const data of registrationData) {
      // Find the existing record
      const existingRecord = await dbPool.query.registrationData.findFirst({
        where: and(
          eq(db.registrationData.registrationId, registrationId),
          eq(db.registrationData.registrationFieldId, data.registrationFieldId),
        ),
      });

      if (existingRecord) {
        // If the record exists, update it
        await dbPool
          .update(db.registrationData)
          .set({ value: data.value, updatedAt: new Date() })
          .where(and(eq(db.registrationData.id, existingRecord.id)));

        // Push the updated record into the array
        updatedRegistrationData.push({ ...existingRecord, value: data.value });
      } else {
        // If the record doesn't exist, insert a new one
        const insertedRecord = await dbPool
          .insert(db.registrationData)
          .values({
            registrationId,
            registrationFieldId: data.registrationFieldId,
            value: data.value,
          })
          .returning();

        if (insertedRecord?.[0]) {
          updatedRegistrationData.push(insertedRecord?.[0]);
        }
      }
    }

    return updatedRegistrationData;
  } catch (e) {
    console.log('Error updating/inserting registration data ' + JSON.stringify(e));
    return null;
  }
}

/**
 * Fetches registration fields from the database.
 * @param dbPool - The database pool instance.
 * @param registrationFieldIds - Array of registration field IDs.
 * @returns An array of registration fields.
 */
async function fetchRegistrationFields(
  dbPool: PostgresJsDatabase<typeof db>,
  registrationFieldIds: string[],
): Promise<
  {
    registrationFieldId: string;
    questionId: string;
    questionOptionType: string;
  }[]
> {
  const query = (await dbPool
    .select({
      registrationFieldId: db.registrationFields.id,
      questionId: db.registrationFields.questionId,
      questionOptionType: db.registrationFields.questionOptionType,
    })
    .from(db.registrationFields)
    .where(
      and(
        isNotNull(db.registrationFields.questionId),
        inArray(db.registrationFields.questionOptionType, ['TITLE', 'SUBTITLE']),
        inArray(db.registrationFields.id, registrationFieldIds),
      ),
    )) as {
    registrationFieldId: string;
    questionId: string;
    questionOptionType: 'TITLE' | 'SUBTITLE';
  }[];

  return query;
}

/**
 * Filters registration data based on the available registration fields.
 * @param registrationData - An array of registration data.
 * @param registrationFields - An array of registration fields.
 * @returns Filtered registration data.
 */
function filterRegistrationData(
  registrationData: {
    id: string;
    registrationFieldId: string;
    registrationId: string;
    value: string;
  }[],
  registrationFields: {
    registrationFieldId: string;
    questionId: string;
    questionOptionType: string;
  }[],
): {
  id: string;
  registrationFieldId: string;
  registrationId: string;
  value: string;
}[] {
  // Filter registration data to include only entries that require updating
  const filteredRegistrationData = registrationData.filter((data) =>
    registrationFields.some((field) => field.registrationFieldId === data.registrationFieldId),
  );

  return filteredRegistrationData;
}

/**
 * Maps filtered registration data to a combined format.
 * @param filteredRegistrationData - Filtered registration data.
 * @returns Combined registration data.
 */
function transformRegistrationDataToCombinedFormat(
  filteredRegistrationData: {
    id: string;
    registrationFieldId: string;
    registrationId: string;
    value: string;
  }[],
  registrationFields: {
    registrationFieldId: string;
    questionId: string;
    questionOptionType: string;
  }[],
): {
  registrationId: string;
  questionId: string;
  values: { [questionOptionType: string]: string };
}[] {
  const combinedData = filteredRegistrationData.map((data) => {
    const matchingField = registrationFields.find(
      (field) => field.registrationFieldId === data.registrationFieldId,
    );
    if (matchingField) {
      return {
        registrationId: data.registrationId,
        questionId: matchingField.questionId,
        values: {
          [matchingField.questionOptionType]: data.value,
        },
      };
    }
    throw new Error(`No matching field found for registrationFieldId: ${data.registrationFieldId}`);
  });

  return combinedData;
}

/**
 * Updates or inserts question options based on the combined data.
 * @param dbPool - The database pool instance.
 * @param combinedData - Combined registration data.
 */
async function upsertQuestionOptions(
  dbPool: PostgresJsDatabase<typeof db>,
  combinedData: {
    registrationId: string;
    questionId: string;
    values: { [questionOptionType: string]: string };
  }[],
): Promise<void> {
  for (const data of combinedData) {
    // Check whether a corresponding question option exists
    const existingQuestionOption = await dbPool.query.questionOptions.findFirst({
      where: eq(db.questionOptions.registrationId, data.registrationId),
    });

    if (existingQuestionOption) {
      // Update question option
      await dbPool
        .update(db.questionOptions)
        .set({
          registrationId: data.registrationId,
          questionId: data.questionId,
          optionTitle: data.values['TITLE'] || existingQuestionOption.optionTitle,
          optionSubTitle: data.values['SUBTITLE'] || existingQuestionOption.optionSubTitle,
          updatedAt: new Date(),
        })
        .where(eq(db.questionOptions.id, existingQuestionOption.id))
        .returning();
    } else {
      // Insert new question option
      await dbPool
        .insert(db.questionOptions)
        .values({
          registrationId: data.registrationId,
          questionId: data.questionId,
          optionTitle: data.values['TITLE'] || '',
          optionSubTitle: data.values['SUBTITLE'] || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
    }
  }
}

/**
 * Main function to update question options.
 * @param dbPool - The database pool instance.
 * @param registrationData - An array of registration data.
 */
export async function upsertQuestionOptionFromRegistrationData(
  dbPool: PostgresJsDatabase<typeof db>,
  registrationData:
    | {
        id: string;
        registrationFieldId: string;
        registrationId: string;
        value: string;
      }[]
    | null,
): Promise<void> {
  try {
    if (!registrationData) {
      return;
    }

    const registrationFieldIds = registrationData.map((data) => data.registrationFieldId);

    const registrationFields = await fetchRegistrationFields(dbPool, registrationFieldIds);

    const filteredRegistrationData = filterRegistrationData(registrationData, registrationFields);

    const combinedData = transformRegistrationDataToCombinedFormat(
      filteredRegistrationData,
      registrationFields,
    );

    await upsertQuestionOptions(dbPool, combinedData);
  } catch (e) {
    console.error('Error updating or inserting question options:', e);
    throw e;
  }
}
