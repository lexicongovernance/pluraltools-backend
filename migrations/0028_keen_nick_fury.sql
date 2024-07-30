ALTER TABLE "options" RENAME COLUMN "accepted" TO "show";--> statement-breakpoint
ALTER TABLE "questions_to_group_categories" ALTER COLUMN "group_category_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "fields" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "data" jsonb;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "user_can_create" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "fields" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "options" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "options" ADD COLUMN "data" jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "options" ADD CONSTRAINT "options_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "status_idx" ON "cycles" ("status");