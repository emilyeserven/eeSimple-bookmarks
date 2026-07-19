import type { Bookmark } from "./index.js";

/** The slice of a hydrated bookmark the free-text search reads. */
export type TextSearchableBookmark = Pick<
  Bookmark,
  "title" | "names" | "url" | "description" | "sectionsValues"
>;

/** Whether any section entry (or depth-2 child) across `values` has a name containing `q`. */
function sectionNamesMatch(values: TextSearchableBookmark["sectionsValues"], q: string): boolean {
  return values.some(value => value.sections.some(entry =>
    entry.name.toLowerCase().includes(q)
    || (entry.children ?? []).some(child => child.name.toLowerCase().includes(q))));
}

/**
 * The shared free-text search predicate behind the listing quick-search box, evaluated server-side
 * by `POST /api/bookmarks/search`. Case-insensitive substring match over the bookmark's title,
 * alternate names, URL, description, and section entry names (both tiers). Section start/end
 * values and section URLs are deliberately NOT matched — page numbers/timestamps would produce
 * noisy hits. `q` must already be trimmed + lowercased by the caller; an empty `q` matches
 * everything.
 */
export function bookmarkMatchesText(bookmark: TextSearchableBookmark, q: string): boolean {
  if (q === "") return true;
  return bookmark.title.toLowerCase().includes(q)
    || bookmark.names.some(name => name.value.toLowerCase().includes(q))
    || (bookmark.url?.toLowerCase() ?? "").includes(q)
    || (bookmark.description ?? "").toLowerCase().includes(q)
    || sectionNamesMatch(bookmark.sectionsValues, q);
}
