DO $$ BEGIN
 ALTER TABLE "registration_fields" ADD CONSTRAINT "registration_fields_question_id_forum_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "forum_questions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
