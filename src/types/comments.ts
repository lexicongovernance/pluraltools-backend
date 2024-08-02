import { createInsertSchema } from 'drizzle-zod';
import { comments } from '../db/schema/comments';

export const insertCommentSchema = createInsertSchema(comments);
