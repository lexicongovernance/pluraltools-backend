ALTER TABLE "questions" RENAME TO "forum_questions";--> statement-breakpoint
ALTER TABLE "options" DROP CONSTRAINT "options_question_id_questions_id_fk";
--> statement-breakpoint
ALTER TABLE "forum_questions" DROP CONSTRAINT "questions_cycle_id_cycles_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "options" ADD CONSTRAINT "options_question_id_forum_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "forum_questions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forum_questions" ADD CONSTRAINT "forum_questions_cycle_id_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
