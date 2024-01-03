ALTER TABLE "question_options" ALTER COLUMN "vote_count" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "question_options" ALTER COLUMN "vote_count" SET DEFAULT '0.0';