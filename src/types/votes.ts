import { createInsertSchema } from 'drizzle-zod';
import { votes } from '../db/schema/votes';

export const insertVotesSchema = createInsertSchema(votes);
