/**
 * URL-persisted filter state for the **Settings → Card Display Rules** listing. `scope` + `scopeSlug`
 * pin the list to a single entity (the taxonomy tab you came from) so the filtered view is a
 * shareable, reload-safe deeplink. Unlike the Autofill listing there is no category dropdown or text
 * search to carry — `CardDisplayRulesList` already filters by scope alone — so the search is just the
 * scope pair. Both fields are optional; a clean URL carries neither. TanStack Router's default
 * serializer round-trips this flat object.
 */

/** Entity kinds a card display rule can be scoped to in the Settings → Card Display Rules listing. */
export const CARD_DISPLAY_SCOPE_TYPES = [
  "category",
  "property",
  "website",
  "tag",
  "media-type",
  "channel",
] as const;

export type CardDisplayScopeType = typeof CARD_DISPLAY_SCOPE_TYPES[number];

export interface CardDisplayListSearch {
  /** Pin the list to a single entity of this kind (paired with `scopeSlug`). */
  scope?: CardDisplayScopeType;
  /** The slug of the scoped entity (resolved to its id on the page). */
  scopeSlug?: string;
}

function isScopeType(value: unknown): value is CardDisplayScopeType {
  return typeof value === "string" && (CARD_DISPLAY_SCOPE_TYPES as readonly string[]).includes(value);
}

function trimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Validate/normalize raw search params: drop an unknown `scope` and ignore a `scopeSlug` with no
 * `scope`, omitting empty strings so the URL stays clean.
 */
export function validateCardDisplayListSearch(raw: Record<string, unknown>): CardDisplayListSearch {
  const result: CardDisplayListSearch = {};
  if (isScopeType(raw.scope)) result.scope = raw.scope;
  const scopeSlug = trimmedString(raw.scopeSlug);
  // A scopeSlug is only meaningful alongside a scope.
  if (result.scope && scopeSlug) result.scopeSlug = scopeSlug;
  return result;
}
