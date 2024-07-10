ALTER TABLE "questions" ADD COLUMN "user_can_create" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "options" ADD COLUMN "group_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "options" ADD CONSTRAINT "options_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
