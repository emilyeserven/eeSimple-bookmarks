/**
 * URL-persisted filter state for the **Settings → Autofill** listing. `scope` + `scopeSlug` pin the
 * list to a single entity (the taxonomy tab you came from); `category` / `q` mirror the in-page
 * category dropdown and text search so the whole filtered view is a shareable, reload-safe deeplink.
 * Every field is optional — a clean URL carries none of them. TanStack Router's default serializer
 * round-trips this flat object.
 */

/** Entity kinds an autofill rule can be scoped to in the Settings → Autofill listing. */
export const AUTOFILL_SCOPE_TYPES = [
  "category",
  "property",
  "website",
  "tag",
  "media-type",
  "channel",
] as const;

export type AutofillScopeType = typeof AUTOFILL_SCOPE_TYPES[number];

export interface AutofillListSearch {
  /** Pin the list to a single entity of this kind (paired with `scopeSlug`). */
  scope?: AutofillScopeType;
  /** The slug of the scoped entity (resolved to its id on the page). */
  scopeSlug?: string;
  /** Mirror of the category dropdown: a category id, or `"none"` for "no category" (`"all"` is omitted). */
  category?: string;
  /** Mirror of the text search box. */
  q?: string;
}

function isScopeType(value: unknown): value is AutofillScopeType {
  return typeof value === "string" && (AUTOFILL_SCOPE_TYPES as readonly string[]).includes(value);
}

function trimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Validate/normalize raw search params: drop an unknown `scope`, ignore a `scopeSlug` with no
 * `scope`, drop the `"all"` category sentinel, and omit empty strings so the URL stays clean.
 */
export function validateAutofillListSearch(raw: Record<string, unknown>): AutofillListSearch {
  const result: AutofillListSearch = {};
  if (isScopeType(raw.scope)) result.scope = raw.scope;
  const scopeSlug = trimmedString(raw.scopeSlug);
  // A scopeSlug is only meaningful alongside a scope.
  if (result.scope && scopeSlug) result.scopeSlug = scopeSlug;
  const category = trimmedString(raw.category);
  if (category && category !== "all") result.category = category;
  const q = trimmedString(raw.q);
  if (q) result.q = q;
  return result;
}
