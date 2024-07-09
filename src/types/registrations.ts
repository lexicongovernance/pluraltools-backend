import { createInsertSchema } from 'drizzle-zod';
import { registrations } from '../db/registrations';
import { dataSchema } from './validation';

export const insertRegistrationSchema = createInsertSchema(registrations, {
  data: dataSchema,
});

export const insertSimpleRegistrationSchema = createInsertSchema(registrations);
