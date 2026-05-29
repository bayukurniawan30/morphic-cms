ALTER TABLE "users" ADD COLUMN "two_factor_secret" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "recovery_codes" jsonb DEFAULT '[]'::jsonb NOT NULL;