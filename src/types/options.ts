import { createInsertSchema } from 'drizzle-zod';
import { dataSchema } from './validation';
import { options } from '../db';

export const insertOptionsSchema = createInsertSchema(options, {
  data: dataSchema,
});
