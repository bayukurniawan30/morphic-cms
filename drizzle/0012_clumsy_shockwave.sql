ALTER TABLE "entry_versions" ADD COLUMN "tenant_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan_tier" varchar(50) DEFAULT 'FREE' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "allowed_monthly_requests" integer DEFAULT 20000 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "entry_versions" ADD CONSTRAINT "entry_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
