ALTER TABLE "comments" ADD COLUMN "username" varchar;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_username_users_username_fk" FOREIGN KEY ("username") REFERENCES "users"("username") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
