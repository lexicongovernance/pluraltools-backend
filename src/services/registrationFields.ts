import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../db';
import { and, eq } from 'drizzle-orm';

export async function validateRequiredRegistrationFields({
  data,
  dbPool,
  forGroup,
  forUser,
}: {
  dbPool: PostgresJsDatabase<typeof db>;
  data: {
    eventId: string;
    registrationData: {
      registrationFieldId: string;
      value: string;
    }[];
  };
  forUser: boolean;
  forGroup: boolean;
}) {
  // check if all required fields are filled
  const event = await dbPool.query.events.findFirst({
    with: {
      registrationFields: {
        where: and(
          eq(db.registrationFields.forUser, forUser),
          eq(db.registrationFields.forGroup, forGroup),
          eq(db.registrationFields.required, true),
        ),
      },
    },
    where: eq(db.events.id, data.eventId),
  });
  const requiredFields = event?.registrationFields;

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
