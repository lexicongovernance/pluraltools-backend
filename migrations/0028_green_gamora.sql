ALTER TABLE "options" RENAME COLUMN "accepted" TO "show";--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "fields" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "data" jsonb;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "fields" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "options" ADD COLUMN "data" jsonb;