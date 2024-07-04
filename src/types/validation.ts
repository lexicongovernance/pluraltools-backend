import { z } from 'zod';

export const fieldsSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    type: z.enum(['TEXT', 'TEXTAREA', 'SELECT', 'CHECKBOX', 'MULTI_SELECT', 'NUMBER']),
    position: z.number(),
    validation: z.object({
      required: z.boolean(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
    }),
  }),
);

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

// [fieldId] => { value: [value], fieldId: [fieldId] }
export const dataSchema = z.record(z.string(), fieldDataSchema);
