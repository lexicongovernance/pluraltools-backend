DO $$ BEGIN
 CREATE TYPE "registration_enum" AS ENUM('DRAFT', 'PUBLISHED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"username" varchar(256),
	"email" varchar(256),
	"proposal_title" varchar(256) NOT NULL,
	"proposal_abstract" varchar,
	"status" "registration_enum",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "registrations_username_unique" UNIQUE("username"),
	CONSTRAINT "registrations_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "federated_credentials" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registrations" ADD CONSTRAINT "registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
