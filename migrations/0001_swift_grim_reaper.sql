CREATE TABLE IF NOT EXISTS "options" (
	"id" uuid NOT NULL,
	"text" varchar(256) NOT NULL,
	"vote_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "options" ADD CONSTRAINT "options_id_cycles_id_fk" FOREIGN KEY ("id") REFERENCES "cycles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
