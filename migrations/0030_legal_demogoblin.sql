CREATE TABLE IF NOT EXISTS "access_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(256),
	"subject" varchar(256),
	"is_allowed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "access_rules_provider_subject_idx" UNIQUE("provider","subject")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "is_allowed_idx" ON "access_rules" ("is_allowed");