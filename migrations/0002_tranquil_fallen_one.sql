ALTER TABLE "question_options" ADD COLUMN "description" varchar;--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN "question_id" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "votes" ADD CONSTRAINT "votes_question_id_forum_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "forum_questions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
