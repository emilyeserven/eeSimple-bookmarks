/**
 * Pure helpers for displaying and sorting entities (tags, bookmarks) that carry an optional
 * romanized form alongside their real name/title. Kept framework-free so they can be unit-tested
 * directly and reused by every render site via {@link "../components/RomanizedLabel"}.
 */

/** A primary label and an optional de-emphasized secondary label to render after it. */
export interface RomanizedDisplay {
  primary: string;
  secondary: string | null;
}

/** Normalize a possibly-null romanized value to a trimmed string, or `null` when empty. */
function cleanRomanized(romanized: string | null | undefined): string | null {
  const trimmed = romanized?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Decide which of the real name and its romanized form is primary. With no romanized value the
 * primary is the name and there is no secondary. When `showRomanizedFirst` is true the romanized
 * form becomes primary and the real name is the de-emphasized secondary; otherwise the reverse.
 */
export function orderRomanized(
  name: string,
  romanized: string | null | undefined,
  showRomanizedFirst: boolean,
): RomanizedDisplay {
  const rom = cleanRomanized(romanized);
  if (!rom) return {
    primary: name,
    secondary: null,
  };
  return showRomanizedFirst
    ? {
      primary: rom,
      secondary: name,
    }
    : {
      primary: name,
      secondary: rom,
    };
}

/**
 * The string to sort by. When `sortByRomanized` is true and a romanized value is present, sort by
 * it; otherwise fall back to the real name (so entries without a romanized form still sort sanely).
 */
export function romanizedSortKey(
  name: string,
  romanized: string | null | undefined,
  sortByRomanized: boolean,
): string {
  const rom = cleanRomanized(romanized);
  return sortByRomanized && rom ? rom : name;
}
