ALTER TABLE "users_to_groups" ADD COLUMN "group_label_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_to_groups" ADD CONSTRAINT "users_to_groups_group_label_id_group_categories_id_fk" FOREIGN KEY ("group_label_id") REFERENCES "group_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
