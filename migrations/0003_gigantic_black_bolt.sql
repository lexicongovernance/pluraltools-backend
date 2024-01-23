ALTER TABLE "cycles" ALTER COLUMN "status" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "cycles" ALTER COLUMN "status" SET DEFAULT 'UPCOMING';