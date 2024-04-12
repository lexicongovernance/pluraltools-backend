ALTER TABLE "group_categories" ADD COLUMN "user_can_create" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "group_categories" ADD COLUMN "user_can_view" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "secret" varchar(256);--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_secret_unique" UNIQUE("secret");