import type { Bookmark } from "./index.js";

/** The slice of a hydrated bookmark the free-text search reads. */
export type TextSearchableBookmark = Pick<
  Bookmark,
  "title" | "names" | "url" | "description" | "sectionsValues"
>;

/** Which field of a bookmark a free-text query matched, for the "Match Type" card display. */
export type TextMatchField = "title" | "name" | "url" | "description" | "section";

/** Whether any section entry (or depth-2 child) across `values` has a name containing `q`. */
function sectionNamesMatch(values: TextSearchableBookmark["sectionsValues"], q: string): boolean {
  return values.some(value => value.sections.some(entry =>
    entry.name.toLowerCase().includes(q)
    || (entry.children ?? []).some(child => child.name.toLowerCase().includes(q))));
}

/**
 * Which of the searchable fields of `bookmark` contain `q`, in display-priority order
 * (title → name → url → description → section). `q` must already be trimmed + lowercased; an empty
 * `q` returns `[]` (there is no "matched here" to show for a blank query — unlike
 * {@link bookmarkMatchesText}, where a blank query matches everything for filtering). Section
 * start/end values and section URLs are deliberately excluded, matching the search predicate.
 */
export function bookmarkTextMatchFields(bookmark: TextSearchableBookmark, q: string): TextMatchField[] {
  if (q === "") return [];
  const fields: TextMatchField[] = [];
  if (bookmark.title.toLowerCase().includes(q)) fields.push("title");
  if (bookmark.names.some(name => name.value.toLowerCase().includes(q))) fields.push("name");
  if ((bookmark.url?.toLowerCase() ?? "").includes(q)) fields.push("url");
  if ((bookmark.description ?? "").toLowerCase().includes(q)) fields.push("description");
  if (sectionNamesMatch(bookmark.sectionsValues, q)) fields.push("section");
  return fields;
}

/**
 * The shared free-text search predicate behind the listing quick-search box, evaluated server-side
 * by `POST /api/bookmarks/search`. Case-insensitive substring match over the bookmark's title,
 * alternate names, URL, description, and section entry names (both tiers). Section start/end
 * values and section URLs are deliberately NOT matched — page numbers/timestamps would produce
 * noisy hits. `q` must already be trimmed + lowercased by the caller; an empty `q` matches
 * everything. Kept in lockstep with {@link bookmarkTextMatchFields} (the "where did it match" twin).
 */
export function bookmarkMatchesText(bookmark: TextSearchableBookmark, q: string): boolean {
  if (q === "") return true;
  return bookmarkTextMatchFields(bookmark, q).length > 0;
}
