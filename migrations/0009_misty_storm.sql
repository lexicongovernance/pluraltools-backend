ALTER TABLE "question_options" DROP CONSTRAINT "question_options_registration_data_id_registration_data_id_fk";
--> statement-breakpoint
ALTER TABLE "question_options" ADD COLUMN "registration_id" uuid;--> statement-breakpoint
ALTER TABLE "registration_fields" ADD COLUMN "question_option_type" varchar;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "question_options" ADD CONSTRAINT "question_options_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "question_options" DROP COLUMN IF EXISTS "registration_data_id";