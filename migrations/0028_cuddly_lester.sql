ALTER TABLE "events" ADD COLUMN "registration_fields" jsonb;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "data" jsonb;