ALTER TABLE "alerts" RENAME TO "nav_links";--> statement-breakpoint
ALTER TABLE "nav_links" ADD COLUMN "event_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nav_links" ADD CONSTRAINT "nav_links_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
