/**
 * URL-search model for the Settings → Relationships page. A single optional `bookmark` id focuses the
 * page on one bookmark's relationships editor; when absent the page shows a bookmark picker. Carrying
 * the id in the URL makes the focused view a shareable, reload-safe deeplink — the old bookmark
 * "Relationships" edit tab redirects here with its id preselected.
 */
export interface RelationshipsListSearch {
  bookmark?: string;
}

export function validateRelationshipsListSearch(raw: Record<string, unknown>): RelationshipsListSearch {
  const bookmark = typeof raw.bookmark === "string" ? raw.bookmark.trim() : "";
  return bookmark
    ? {
      bookmark,
    }
    : {};
}
