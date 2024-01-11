import { createInsertSchema } from 'drizzle-zod';
import { registrations } from '../db/registrations';
import { z } from 'zod';

// array of registration data
export const registrationDataSchema = z
  .object({
    registrationFieldId: z.string(),
    value: z.string(),
  })
  .array();

export const insertRegistrationSchema = createInsertSchema(registrations).extend({
  registrationData: registrationDataSchema,
});
