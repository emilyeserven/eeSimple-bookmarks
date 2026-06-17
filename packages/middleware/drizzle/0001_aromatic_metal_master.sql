ALTER TABLE "bookmarks" ADD COLUMN "original_url" text;--> statement-breakpoint
ALTER TABLE "websites" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_url_unique" UNIQUE("url");--> statement-breakpoint
ALTER TABLE "websites" ADD CONSTRAINT "websites_slug_unique" UNIQUE("slug");