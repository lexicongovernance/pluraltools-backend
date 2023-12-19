CREATE TABLE IF NOT EXISTS "questions" (
	"id" uuid NOT NULL,
	"title" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_id_cycles_id_fk" FOREIGN KEY ("id") REFERENCES "cycles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
