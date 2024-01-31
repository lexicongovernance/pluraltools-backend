ALTER TABLE "registration_options" RENAME TO "registration_field_options";--> statement-breakpoint
ALTER TABLE "registration_field_options" DROP CONSTRAINT "registration_options_registration_field_id_registration_fields_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registration_field_options" ADD CONSTRAINT "registration_field_options_registration_field_id_registration_fields_id_fk" FOREIGN KEY ("registration_field_id") REFERENCES "registration_fields"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
