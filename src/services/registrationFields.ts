import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';

export async function validateRequiredRegistrationFields(
  dbPool: PostgresJsDatabase<typeof db>,
  data: {
    eventId: string;
    registrationData: {
      registrationFieldId: string;
      value: string;
    }[];
  },
) {
  // check if all required fields are filled
  const event = await dbPool.query.events.findFirst({
    with: {
      registrationFields: true,
    },
    where: (event, { eq }) => eq(event.id, data.eventId),
  });
  const requiredFields = event?.registrationFields.filter((field) => field.required);

  if (!requiredFields) {
    return [];
  }

  // loop through required fields and check if they are filled
  const missingFields = requiredFields.filter(
    (field) => !data.registrationData.some((data) => data.registrationFieldId === field.id),
  );

  return missingFields.map((field) => ({
    field: field.name,
    message: 'missing required field',
  }));
}
