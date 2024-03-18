ALTER TABLE "group_categories" RENAME COLUMN "group_label" TO "group_category";--> statement-breakpoint
ALTER TABLE "groups" RENAME COLUMN "group_label_id" TO "group_category_id";--> statement-breakpoint
ALTER TABLE "groups" DROP CONSTRAINT "groups_group_label_id_group_categories_id_fk";
--> statement-breakpoint
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
