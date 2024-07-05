import { z } from 'zod';

const fieldType = z.enum(['TEXT', 'TEXTAREA', 'SELECT', 'CHECKBOX', 'MULTI_SELECT', 'NUMBER']);

export const fieldsSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    type: fieldType,
    position: z.number(),
    options: z.array(z.string()).optional(),
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
  type: fieldType,
});

// [fieldId] => { value: [value], fieldId: [fieldId] }
export const dataSchema = z.record(z.string(), fieldDataSchema);
