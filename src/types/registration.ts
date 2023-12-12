import { createInsertSchema } from 'drizzle-zod';
import { registrations } from '../db/registrations';

export const insertRegistrationSchema = createInsertSchema(registrations);
