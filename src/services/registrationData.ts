import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { eq } from 'drizzle-orm';

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
  // delete all groups that previously existed
  try {
    await dbPool
      .delete(db.registrationData)
      .where(eq(db.registrationData.registrationId, registrationId));
  } catch (e) {
    console.log('error deleting registration data ' + JSON.stringify(e));
    return null;
  }
  // save the new ones
  const newRegistrationData = await dbPool
    .insert(db.registrationData)
    .values(
      registrationData.map((data) => ({
        registrationId,
        registrationFieldId: data.registrationFieldId,
        value: data.value,
      })),
    )
    .returning();
  // return new registration data
  return newRegistrationData;
}
