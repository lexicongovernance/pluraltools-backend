ALTER TABLE "registration_fields" DROP CONSTRAINT "registration_fields_question_id_forum_questions_id_fk";
--> statement-breakpoint
ALTER TABLE "registration_fields" DROP COLUMN IF EXISTS "question_id";--> statement-breakpoint
ALTER TABLE "registration_fields" DROP COLUMN IF EXISTS "question_option_type";