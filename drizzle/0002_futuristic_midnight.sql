ALTER TABLE "documents" ADD COLUMN "asset_id" varchar(255);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "resource_type" varchar(50);--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "asset_id" varchar(255);--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "resource_type" varchar(50);