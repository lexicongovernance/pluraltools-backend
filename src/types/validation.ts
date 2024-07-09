import { z } from 'zod';

/**
 * Fields schema
 */

const fieldType = z.enum(['TEXT', 'TEXTAREA', 'SELECT', 'CHECKBOX', 'MULTI_SELECT', 'NUMBER']);

export const fieldsSchema = z.array(
  z.object({
    id: z.string().uuid(),
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

/**
 * Data Schema
 */

const dataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()), // For multi-select fields
  z.null(), // In case of optional fields
]);

// Define a schema for a single field
const dataForOneFieldSchema = z.object({
  value: dataValueSchema,
  fieldId: z.string().uuid(),
  type: fieldType,
});

// [fieldId] => { value: [value], fieldId: [fieldId] }
export const dataSchema = z.record(z.string(), dataForOneFieldSchema);
