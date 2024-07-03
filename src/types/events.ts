import { z } from 'zod';

export const registrationFieldsSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    type: z.enum(['TEXT', 'TEXTAREA', 'SELECT']),
    position: z.number(),
    validation: z.object({
      required: z.boolean(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
    }),
  }),
);
