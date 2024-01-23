ALTER TYPE "cycles_enum" ADD VALUE 'UPCOMING';--> statement-breakpoint
ALTER TABLE "cycles" ALTER COLUMN "status" SET DEFAULT 'UPCOMING';