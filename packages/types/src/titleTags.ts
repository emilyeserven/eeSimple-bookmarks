/**
 * Shared "auto-tag from title" matcher — decides which tags a bookmark's title (and its romanized
 * form) implies. Pure, dependency-free, so it runs unchanged in the Fastify API
 * (`@eesimple/middleware`, at create / backfill time) and in the browser (`@eesimple/client`, for
 * the Inbox prefill preview) — one implementation, no parallel re-translation.
 *
 * A tag matches when any of its name forms (`name`, `romanizedName`) is found in any of the
 * bookmark's title forms (`title`, `romanizedName`). Latin terms match on whole-word boundaries
 * (so a tag named "art" does not match "Martin"); terms in scripts that aren't space-delimited
 * (Han / Hiragana / Katakana / Hangul) match as substrings (so "부산" matches "부산광역시", which
 * has no word boundary). Matching is case-insensitive throughout.
 */

/** A tag reduced to the fields the title matcher needs. */
export interface TitleTagCandidate {
  id: string;
  name: string;
  romanizedName?: string | null;
}

/** Escape a string for safe interpolation into a RegExp body. Pure helper. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whether `value` contains a character from a script that isn't written with word-separating
 * spaces (Han, Hiragana, Katakana, Hangul). For these, whole-word matching never fires inside a
 * compound, so the matcher falls back to substring matching.
 */
function isNonSpacedScript(value: string): boolean {
  return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(value);
}

/**
 * Whether `term` appears in `haystack`. Non-spaced scripts match as a case-insensitive substring;
 * everything else matches as a whole word, using unicode-aware word boundaries (a non-letter/
 * non-number on each side, or a string edge) so "art" does not match inside "Martin" while
 * punctuated names like "sci-fi" still match. Pure helper.
 */
export function titleMatchesTerm(haystack: string, term: string): boolean {
  const name = term.trim();
  if (!name) return false;
  if (isNonSpacedScript(name)) {
    return haystack.toLowerCase().includes(name.toLowerCase());
  }
  const re = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRegExp(name)}(?:[^\\p{L}\\p{N}]|$)`, "iu");
  return re.test(haystack);
}

/**
 * The ids of tags implied by a bookmark's title. Each tag's `name` and `romanizedName` are tested
 * against both the bookmark's `title` and its `romanizedName` (when present) via
 * {@link titleMatchesTerm}. Empty/whitespace haystacks and terms are ignored. Pure helper.
 */
export function matchTagIdsByTitle(
  title: string,
  romanizedName: string | null | undefined,
  tags: TitleTagCandidate[],
): string[] {
  const haystacks = [title, romanizedName ?? ""].filter(text => text.trim() !== "");
  if (haystacks.length === 0) return [];
  return tags
    .filter((tag) => {
      const terms = [tag.name, tag.romanizedName ?? ""].filter(text => text.trim() !== "");
      return terms.some(term => haystacks.some(haystack => titleMatchesTerm(haystack, term)));
    })
    .map(tag => tag.id);
}
