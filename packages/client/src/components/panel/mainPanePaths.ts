import type { DrawerContentType } from "@/lib/drawerSearch";

/**
 * Builds the main-pane view URL for an entity given its content type, URL slug/id, and active tab.
 * Returns null for content types without a standalone slug-routed page.
 *
 * The tab key matches the URL path segment (e.g. "general", "youtube-channels"). Bookmark view has
 * no tab segment; all other entities use `/{slug}/{tab}` in view mode.
 */
export function buildMainPanePath(
  contentType: DrawerContentType,
  slug: string,
  tab: string,
): string | null {
  switch (contentType) {
    case "bookmark":
      return `/bookmarks/${slug}`;
    case "category":
      return `/categories/${slug}/${tab}`;
    case "tag":
      return `/tags/${slug}/${tab}`;
    case "property":
      return `/custom-properties/${slug}/${tab}`;
    case "property-group":
      return `/taxonomies/property-groups/${slug}/${tab}`;
    case "website":
      return `/taxonomies/websites/${slug}/${tab}`;
    case "media-type":
      return `/taxonomies/media-types/${slug}/${tab}`;
    case "place-type":
      return `/taxonomies/place-types/${slug}/${tab}`;
    case "youtube-channel":
      return `/taxonomies/youtube-channels/${slug}/${tab}`;
    case "newsletter":
      return `/taxonomies/newsletters/${slug}/${tab}`;
    case "author":
      return `/taxonomies/authors/${slug}/${tab}`;
    case "publisher":
      return `/taxonomies/publishers/${slug}/${tab}`;
    case "relationship-type":
      return `/taxonomies/relationship-types/${slug}/${tab}`;
    case "autofill":
      return `/autofill/${slug}/${tab}`;
    case "card-display-rule":
      return `/card-display-rules/${slug}/${tab}`;
    case "import-rule":
      return `/import-rules/${slug}/${tab}`;
    case "saved-filter":
      return `/saved-filters/${slug}/${tab}`;
    default:
      return null;
  }
}
