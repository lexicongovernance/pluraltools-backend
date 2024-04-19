ALTER TABLE "registration_fields" RENAME COLUMN "display_on_group_registration" TO "for_group";--> statement-breakpoint
ALTER TABLE "registration_fields" ADD COLUMN "for_user" boolean DEFAULT true;