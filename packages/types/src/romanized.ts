/**
 * Pure helpers for displaying, deriving, and sorting entities that carry an optional romanized form
 * alongside their real name/title. Framework-free and shared by both the client (every render site via
 * `RomanizedLabel`) and the middleware (the geocoders derive a romanized name with the same rule), so
 * there is one implementation of the "which form is primary / is there a distinct romanization" logic.
 */

/** A primary label and an optional de-emphasized secondary label to render after it. */
export interface RomanizedDisplay {
  primary: string;
  secondary: string | null;
}

/** Normalize a possibly-null romanized value to a trimmed string, or `null` when empty. */
export function cleanRomanized(romanized: string | null | undefined): string | null {
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

/**
 * Derive the romanized name to store from a name and a candidate romanization (e.g. an English label
 * from a geocoder). Returns the trimmed candidate only when it is present and differs from the name;
 * otherwise `null` (a place already written in Latin script has no distinct romanization). The single
 * source of the rule both geocoders (`nominatimGeocoding`, `wikidataGeocoding`) apply.
 */
export function deriveRomanizedName(
  name: string,
  candidate: string | null | undefined,
): string | null {
  const rom = cleanRomanized(candidate);
  return rom && rom !== name ? rom : null;
}
