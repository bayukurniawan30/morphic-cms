CREATE INDEX IF NOT EXISTS "documents_tenant_id_idx" ON "documents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_tenant_size_idx" ON "documents" USING btree ("tenant_id","size");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_tenant_id_idx" ON "media" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_tenant_size_idx" ON "media" USING btree ("tenant_id","size");