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
        registrationId: string;
        value: string;
      }[]
    | null,
): Promise<void> {
  try {
    if (!registrationData) {
      return;
    }
    // Fetch registration_id's from registrationData that have
    // a question_id so it requires question_options to be populated
    const registrationFields = await dbPool.execute<{
      registrationFieldId: string;
      questionId: string;
      questionOptionType: string;
    }>(
      sql.raw(`
          SELECT id AS "registrationFieldId", question_id AS "questionId", question_option_type AS "questionOptionType"
          FROM registration_fields
          WHERE question_id IS NOT NULL
          AND question_option_type IN ('TITLE', 'SUBTITLE')
          AND id IN (${registrationData.map((data) => `'${data.registrationFieldId}'`).join(', ')})
          `),
    );

    console.log('registrationFields', registrationFields);

    // Pre-filter registrationData to include entires that must be updated in question_options
    const filteredRegistrationData = registrationData.filter((data) =>
      registrationFields.some((field) => field.registrationFieldId === data.registrationFieldId),
    );

    console.log('filteredRegistrationData', filteredRegistrationData);

    const output = filteredRegistrationData.map((data) => {
      const matchingField = registrationFields.find(
        (field) => field.registrationFieldId === data.registrationFieldId,
      );
      if (matchingField) {
        return Object.assign({}, matchingField, {
          id: data.id,
          registrationId: data.registrationId,
          value: data.value,
        });
      }
      // If no matching field found return null
      return null;
    });

    console.log('output', output);

    const combinedOutput: {
      [registrationId: string]: {
        registrationId: string;
        questionId: string;
        values: {
          [questionOptionType: string]: string;
        };
      };
    } = {};

    output.forEach((data) => {
      if (data) {
        const key = data.registrationId;
        if (!combinedOutput[key]) {
          combinedOutput[key] = {
            registrationId: data.registrationId,
            questionId: data.questionId,
            values: {},
          };
        }

        // Demand that combinedOutput[key] will always be defined
        combinedOutput[key]!.values[data.questionOptionType] = data.value;
      }
    });

    const outputArray = Object.values(combinedOutput);

    console.log('Combined Output:', outputArray);

    // for each registrationFieldId update or insert question options
    for (const data of outputArray) {
      if (!data) {
        continue;
      }
      // Check whether a corresponding question option exists
      const existingQuestionOption = await dbPool.query.questionOptions.findFirst({
        where: eq(db.questionOptions.registrationId, data?.registrationId || ''),
      });

      if (existingQuestionOption) {
        // Update question option
        await dbPool
          .update(db.questionOptions)
          .set({
            registrationId: data?.registrationId || existingQuestionOption.registrationId,
            questionId: existingQuestionOption.questionId,
            optionTitle: data?.values['TITLE'] || existingQuestionOption.optionTitle,
            optionSubTitle: data?.values['SUBTITLE'] || existingQuestionOption.optionSubTitle,
            updatedAt: new Date(),
          })
          .where(eq(db.questionOptions.id, existingQuestionOption.id))
          .returning();
      } else {
        // Insert new question option
        await dbPool
          .insert(db.questionOptions)
          .values({
            registrationId: data?.registrationId || '',
            questionId: data?.questionId || '',
            optionTitle: data?.values['TITLE'] || '',
            optionSubTitle: data?.values['SUBTITLE'] || '',
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
