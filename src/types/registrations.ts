import { createInsertSchema } from 'drizzle-zod';
import { registrations } from '../db/registrations';
import { z } from 'zod';

const groupIds = z.string().array();
const registrationOptionIds = z.string().array();

export const insertRegistrationSchema = createInsertSchema(registrations).extend({
  groupIds,
  registrationOptionIds,
});
