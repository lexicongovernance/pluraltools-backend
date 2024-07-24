ALTER TABLE "events" ALTER COLUMN "fields" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "fields" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "user_can_create" boolean DEFAULT false;