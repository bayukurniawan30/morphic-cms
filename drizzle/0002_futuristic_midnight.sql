ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "asset_id" varchar(255);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "resource_type" varchar(50);--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "asset_id" varchar(255);--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "resource_type" varchar(50);