-- Hand-tuned to be idempotent (see 0000_public_firedrake.sql for the rationale).
--
-- Databases first provisioned with "drizzle-kit push" already have these columns and unique
-- constraints but no journal entry for this migration, so the generated `ADD COLUMN` /
-- `ADD CONSTRAINT` aborts with "already exists" (SQLSTATE 42701/42710) and the whole migrate run
-- rolls back. `ADD COLUMN IF NOT EXISTS` and the duplicate-object guards make re-applying a no-op
-- while still building the schema on a fresh database.

ALTER TABLE "bookmarks" ADD COLUMN IF NOT EXISTS "original_url" text;--> statement-breakpoint
ALTER TABLE "websites" ADD COLUMN IF NOT EXISTS "slug" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_url_unique" UNIQUE("url");
EXCEPTION
 WHEN duplicate_object OR duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "websites" ADD CONSTRAINT "websites_slug_unique" UNIQUE("slug");
EXCEPTION
 WHEN duplicate_object OR duplicate_table THEN null;
END $$;