-- Hand-tuned to be idempotent (see 0000_public_firedrake.sql for the rationale).
--
-- Databases first provisioned with "drizzle-kit push" already have these columns but no journal entry
-- for this migration, so a plain `ADD COLUMN` aborts with "already exists" (SQLSTATE 42701) and the
-- whole migrate run rolls back. `ADD COLUMN IF NOT EXISTS` makes re-applying a no-op while still
-- building the schema on a fresh database.
--
-- Only the `custom_properties` columns for this feature are migrated here; other schema objects
-- (e.g. homepage_filter, autofill_rules.conditions) are reconciled by the boot-time
-- `drizzle-kit push --force` drift safety net, as they have been on previous releases.

ALTER TABLE "custom_properties" ADD COLUMN IF NOT EXISTS "description" text;--> statement-breakpoint
ALTER TABLE "custom_properties" ADD COLUMN IF NOT EXISTS "value_prefix" text;--> statement-breakpoint
ALTER TABLE "custom_properties" ADD COLUMN IF NOT EXISTS "zero_label" text;--> statement-breakpoint
ALTER TABLE "custom_properties" ADD COLUMN IF NOT EXISTS "max_label" text;--> statement-breakpoint
ALTER TABLE "custom_properties" ADD COLUMN IF NOT EXISTS "advanced_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_properties" ADD COLUMN IF NOT EXISTS "show_in_listings" boolean DEFAULT true NOT NULL;--> statement-breakpoint
-- Preserve placement under the new tri-state model: properties previously rendered under the form's
-- Advanced section (show_in_form = false) keep appearing there as show_in_form = true + advanced_only.
-- Targets only show_in_form = false rows, so re-applying after the flip is a no-op.
UPDATE "custom_properties" SET "advanced_only" = true, "show_in_form" = true WHERE "show_in_form" = false;
