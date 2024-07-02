import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as db from '../db';
import { eq, and } from 'drizzle-orm';

/**
 * Upserts the registration data for a given registrationId.
 * Updates existing records and inserts new ones if necessary.
 * @param dbPool - The database pool instance of type ` NodePgDatabase<typeof db>`.
 * @param registrationId - The ID of the registration to overwrite data for.
 * @param registrationData - An array of objects representing registration data.
 *   Each object should have the properties:
 *   - registrationFieldId: The identifier for the registration field associated with the data.
 *   - value: The value of the registration data.
 * @returns A Promise that resolves to the updated registration data or null if an error occurs.
 */
export async function upsertRegistrationData({
  dbPool,
  registrationId,
  registrationData,
}: {
  dbPool: NodePgDatabase<typeof db>;
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
