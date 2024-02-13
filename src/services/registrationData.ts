import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq, sql, and } from 'drizzle-orm';
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
 * Overwrites the registration data for a given registrationId.
 * Updates existing records and inserts new ones if necessary.
 * @param dbPool - The database pool instance of type `PostgresJsDatabase<typeof db>`.
 * @param registrationId - The ID of the registration to overwrite data for.
 * @param registrationData - An array of objects representing registration data.
 *   Each object should have the properties:
 *   - registrationFieldId: The identifier for the registration field associated with the data.
 *   - value: The value of the registration data.
 * @returns A Promise that resolves to the updated registration data or null if an error occurs.
 */
export async function overwriteRegistrationData({
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
      } else {
        // If the record doesn't exist, insert a new one
        await dbPool.insert(db.registrationData).values({
          registrationId,
          registrationFieldId: data.registrationFieldId,
          value: data.value,
        });
      }
    }

    // Fetch all registration data associated with the registrationId
    const updatedRegistrationData = await dbPool.query.registrationData.findMany({
      where: and(eq(db.registrationData.registrationId, registrationId)),
    });

    // Return the updated registration data
    return updatedRegistrationData;
  } catch (e) {
    console.log('Error updating/inserting registration data ' + JSON.stringify(e));
    return null;
  }
}

/**
 * Function: updateQuestionOptions
 * Updates or inserts registration data into the question options table.
 * @param dbPool - The database pool instance of type `PostgresJsDatabase<typeof db>`.
 * @param registrationData - An array of objects representing registration data.
 *   Each object should have the properties:
 *   - id: The unique identifier for the registration data.
 *   - registrationFieldId: The identifier for the registration field associated with the data.
 *   - value: The value of the registration data.
 * @returns A Promise that resolves once the update/insert operation is completed.
 */
export async function updateQuestionOptions(
  dbPool: PostgresJsDatabase<typeof db>,
  registrationData:
    | {
        id: string;
        registrationFieldId: string;
        value: string;
      }[]
    | null,
): Promise<void> {
  try {
    if (!registrationData) {
      return;
    }
    // Fetch registration_field_ids from registrationData that have
    // a question_id so it requires question_options to be populated
    const registrationFields = await dbPool.execute<{
      registrationFieldId: string;
      questionId: string;
    }>(
      sql.raw(`
          SELECT id AS "registrationFieldId", question_id AS "questionId"
          FROM registration_fields
          WHERE question_id IS NOT NULL
          AND id IN (${registrationData.map((data) => `'${data.registrationFieldId}'`).join(', ')})
          `),
    );

    // Pre-filter registrationData to include only relevant entries (avoids looping thorough the entire set of registration data)
    const filteredRegistrationData = registrationData.filter((data) =>
      registrationFields.some((field) => field.registrationFieldId === data.registrationFieldId),
    );

    // for each registrationFieldId update or insert question options
    for (const registrationField of registrationFields) {
      const registrationDataForField = filteredRegistrationData.find(
        (data) => data.registrationFieldId === registrationField.registrationFieldId,
      );

      // check whether registrationDataForField exists
      const existingQuestionOption = await dbPool.query.questionOptions.findFirst({
        where: eq(db.questionOptions.registrationDataId, registrationDataForField?.id || ''),
      });

      if (existingQuestionOption) {
        // Update question option
        await dbPool
          .update(db.questionOptions)
          .set({
            registrationDataId:
              registrationDataForField?.id || existingQuestionOption.registrationDataId,
            questionId: existingQuestionOption.questionId,
            optionTitle: registrationDataForField?.value || existingQuestionOption.optionTitle,
            updatedAt: new Date(),
          })
          .where(eq(db.questionOptions.id, existingQuestionOption.id))
          .returning();
      } else {
        // Insert new question option
        await dbPool
          .insert(db.questionOptions)
          .values({
            registrationDataId: registrationDataForField?.id || '',
            questionId: registrationField.questionId,
            optionTitle: registrationDataForField?.value || '',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      }
    }
  } catch (e) {
    console.error('Error populating registrationDataId in questionOptions: ', e);
    throw e;
  }
}
