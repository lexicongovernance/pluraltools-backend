ALTER TABLE "options" RENAME TO "question_options";--> statement-breakpoint
ALTER TABLE "votes" DROP CONSTRAINT "votes_option_id_options_id_fk";
--> statement-breakpoint
ALTER TABLE "question_options" DROP CONSTRAINT "options_question_id_forum_questions_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "votes" ADD CONSTRAINT "votes_option_id_question_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "question_options"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_forum_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "forum_questions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
