CREATE TABLE IF NOT EXISTS "group_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_category" varchar,
	"event_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "event_link" varchar;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "group_category_id" uuid;--> statement-breakpoint
ALTER TABLE "users_to_groups" ADD COLUMN "group_category_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groups" ADD CONSTRAINT "groups_group_category_id_group_categories_id_fk" FOREIGN KEY ("group_category_id") REFERENCES "group_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_groups" ADD CONSTRAINT "users_to_groups_group_category_id_group_categories_id_fk" FOREIGN KEY ("group_category_id") REFERENCES "group_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_categories" ADD CONSTRAINT "group_categories_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
