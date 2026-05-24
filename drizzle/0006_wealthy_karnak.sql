ALTER TABLE "forms" ADD COLUMN "collection_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forms" ADD CONSTRAINT "forms_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
