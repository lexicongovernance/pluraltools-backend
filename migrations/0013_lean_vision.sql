CREATE TABLE IF NOT EXISTS "group_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_category_label" varchar,
	"event_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registration_fields" ADD COLUMN "group_category_label_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registration_fields" ADD CONSTRAINT "registration_fields_group_category_label_id_group_category_id_fk" FOREIGN KEY ("group_category_label_id") REFERENCES "group_category"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_category" ADD CONSTRAINT "group_category_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
