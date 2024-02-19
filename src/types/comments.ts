import { createInsertSchema } from 'drizzle-zod';
import { comments } from '../db/comments';

export const insertCommentSchema = createInsertSchema(comments);
