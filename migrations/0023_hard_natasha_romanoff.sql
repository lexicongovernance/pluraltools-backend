ALTER TABLE "group_categories" RENAME COLUMN "user_can_leave" TO "required";--> statement-breakpoint
ALTER TABLE "group_categories" ALTER COLUMN "required" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "forum_questions" ADD COLUMN "show_score" boolean DEFAULT false;