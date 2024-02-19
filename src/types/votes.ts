import { createInsertSchema } from 'drizzle-zod';
import { votes } from '../db/votes';

export const insertVotesSchema = createInsertSchema(votes).array();
