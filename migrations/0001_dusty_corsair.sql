ALTER TABLE "registrations" ALTER COLUMN "status" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "registration_fields" ALTER COLUMN "type" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "registration_fields" ALTER COLUMN "type" SET DEFAULT 'TEXT';