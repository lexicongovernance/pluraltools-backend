ALTER TABLE "users" ADD COLUMN "telegram" varchar(256);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_telegram_unique" UNIQUE("telegram");