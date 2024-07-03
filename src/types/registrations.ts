import { createInsertSchema } from 'drizzle-zod';
import { registrations } from '../db/registrations';
import { z } from 'zod';

const fieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()), // For multi-select fields
  z.null(), // In case of optional fields
]);

// Define a schema for a single field
const fieldDataSchema = z.object({
  value: fieldValueSchema,
  fieldId: z.string().uuid(),
});

// [name] => { value: [value], fieldId: [fieldId] }
const dataSchema = z.record(z.string(), fieldDataSchema);

export const insertRegistrationSchema = createInsertSchema(registrations, {
  data: dataSchema,
});

export const insertSimpleRegistrationSchema = createInsertSchema(registrations);
