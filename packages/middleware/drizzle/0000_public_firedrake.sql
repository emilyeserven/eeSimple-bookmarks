-- Baseline migration (hand-tuned to be idempotent).
--
-- This adopts Drizzle migrations on databases that were originally created with
-- "drizzle-kit push" and therefore have the tables but no migration journal.
-- CREATE TABLE uses IF NOT EXISTS and each foreign key is wrapped so re-applying
-- against an existing database is a no-op; on a fresh database it builds the full
-- schema. Generated migrations after this one are applied normally via the journal.

CREATE TABLE IF NOT EXISTS "autofill_rule_boolean_values" (
	"rule_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"value" boolean NOT NULL,
	CONSTRAINT "autofill_rule_boolean_values_rule_id_property_id_pk" PRIMARY KEY("rule_id","property_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "autofill_rule_number_values" (
	"rule_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"value" real NOT NULL,
	CONSTRAINT "autofill_rule_number_values_rule_id_property_id_pk" PRIMARY KEY("rule_id","property_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "autofill_rule_tags" (
	"rule_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "autofill_rule_tags_rule_id_tag_id_pk" PRIMARY KEY("rule_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "autofill_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"field" text NOT NULL,
	"operator" text NOT NULL,
	"pattern" text NOT NULL,
	"set_category_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookmark_boolean_values" (
	"bookmark_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"value" boolean NOT NULL,
	CONSTRAINT "bookmark_boolean_values_bookmark_id_property_id_pk" PRIMARY KEY("bookmark_id","property_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookmark_number_values" (
	"bookmark_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"value" real NOT NULL,
	CONSTRAINT "bookmark_number_values_bookmark_id_property_id_pk" PRIMARY KEY("bookmark_id","property_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookmark_tags" (
	"bookmark_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "bookmark_tags_bookmark_id_tag_id_pk" PRIMARY KEY("bookmark_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category_id" uuid,
	"website_id" uuid,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calculate_property_operands" (
	"property_id" uuid NOT NULL,
	"operand_property_id" uuid NOT NULL,
	CONSTRAINT "calculate_property_operands_property_id_operand_property_id_pk" PRIMARY KEY("property_id","operand_property_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"description" text,
	"icon" text,
	"built_in" boolean DEFAULT false NOT NULL,
	"is_homepage" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "category_boolean_defaults" (
	"category_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"value" boolean NOT NULL,
	CONSTRAINT "category_boolean_defaults_category_id_property_id_pk" PRIMARY KEY("category_id","property_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "category_number_defaults" (
	"category_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"value" real NOT NULL,
	CONSTRAINT "category_number_defaults_category_id_property_id_pk" PRIMARY KEY("category_id","property_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "category_root_tags" (
	"category_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "category_root_tags_category_id_tag_id_pk" PRIMARY KEY("category_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"number_min" real,
	"number_max" real,
	"unit_singular" text,
	"unit_plural" text,
	"show_in_form" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "homepage_tags" (
	"tag_id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_categories" (
	"property_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "property_categories_property_id_category_id_pk" PRIMARY KEY("property_id","category_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_parent_name_unique" UNIQUE("parent_id","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "websites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" text NOT NULL,
	"site_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "websites_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "autofill_rule_boolean_values" ADD CONSTRAINT "autofill_rule_boolean_values_rule_id_autofill_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."autofill_rules"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "autofill_rule_boolean_values" ADD CONSTRAINT "autofill_rule_boolean_values_property_id_custom_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."custom_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "autofill_rule_number_values" ADD CONSTRAINT "autofill_rule_number_values_rule_id_autofill_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."autofill_rules"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "autofill_rule_number_values" ADD CONSTRAINT "autofill_rule_number_values_property_id_custom_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."custom_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "autofill_rule_tags" ADD CONSTRAINT "autofill_rule_tags_rule_id_autofill_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."autofill_rules"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "autofill_rule_tags" ADD CONSTRAINT "autofill_rule_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "autofill_rules" ADD CONSTRAINT "autofill_rules_set_category_id_categories_id_fk" FOREIGN KEY ("set_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookmark_boolean_values" ADD CONSTRAINT "bookmark_boolean_values_bookmark_id_bookmarks_id_fk" FOREIGN KEY ("bookmark_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookmark_boolean_values" ADD CONSTRAINT "bookmark_boolean_values_property_id_custom_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."custom_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookmark_number_values" ADD CONSTRAINT "bookmark_number_values_bookmark_id_bookmarks_id_fk" FOREIGN KEY ("bookmark_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookmark_number_values" ADD CONSTRAINT "bookmark_number_values_property_id_custom_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."custom_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookmark_tags" ADD CONSTRAINT "bookmark_tags_bookmark_id_bookmarks_id_fk" FOREIGN KEY ("bookmark_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookmark_tags" ADD CONSTRAINT "bookmark_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_website_id_websites_id_fk" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calculate_property_operands" ADD CONSTRAINT "calculate_property_operands_property_id_custom_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."custom_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calculate_property_operands" ADD CONSTRAINT "calculate_property_operands_operand_property_id_custom_properties_id_fk" FOREIGN KEY ("operand_property_id") REFERENCES "public"."custom_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category_boolean_defaults" ADD CONSTRAINT "category_boolean_defaults_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category_boolean_defaults" ADD CONSTRAINT "category_boolean_defaults_property_id_custom_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."custom_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category_number_defaults" ADD CONSTRAINT "category_number_defaults_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category_number_defaults" ADD CONSTRAINT "category_number_defaults_property_id_custom_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."custom_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category_root_tags" ADD CONSTRAINT "category_root_tags_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category_root_tags" ADD CONSTRAINT "category_root_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "homepage_tags" ADD CONSTRAINT "homepage_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property_categories" ADD CONSTRAINT "property_categories_property_id_custom_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."custom_properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property_categories" ADD CONSTRAINT "property_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tags" ADD CONSTRAINT "tags_parent_id_tags_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
