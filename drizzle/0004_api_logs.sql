CREATE TABLE IF NOT EXISTS "api_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer,
	"user_id" integer,
	"method" varchar(10) NOT NULL,
	"path" varchar(1024) NOT NULL,
	"ip" varchar(45) NOT NULL,
	"user_agent" varchar(1024),
	"status_code" integer,
	"response_time" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_logs_created_at_idx" ON "api_logs" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_logs_path_idx" ON "api_logs" ("path");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
