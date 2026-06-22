/**
 * URL-persisted filter state for the **Settings → Autofill** listing. Each facet pins the list to a
 * single entity **by slug**; the facets combine (AND). `category` also accepts the `"none"` sentinel
 * ("rules that set no category"). `q` mirrors the text search. Every field is optional — a clean URL
 * carries none of them — so the filtered view is a shareable, reload-safe deeplink. TanStack Router's
 * default serializer round-trips this flat object.
 */

/** Select sentinel for "every category" / "any X" (omitted from the URL). */
export const ALL_CATEGORIES = "all";

/** Select sentinel for "rules that set no category" (kept in the URL as `category=none`). */
export const NO_CATEGORY = "none";

/** The facet filters available on the Settings → Autofill listing (each keyed by a slug in the URL). */
export const AUTOFILL_FACET_KEYS = [
  "category",
  "property",
  "website",
  "tag",
  "mediaType",
  "channel",
] as const;

export type AutofillFacetKey = typeof AUTOFILL_FACET_KEYS[number];

export interface AutofillListSearch {
  /** Pin to a single category by slug, or `"none"` for "sets no category". */
  category?: string;
  /** Pin to a single custom property by slug. */
  property?: string;
  /** Pin to a single website by slug. */
  website?: string;
  /** Pin to a single tag by slug. */
  tag?: string;
  /** Pin to a single media type by slug. */
  mediaType?: string;
  /** Pin to a single YouTube channel by slug. */
  channel?: string;
  /** Mirror of the text search box. */
  q?: string;
}

/**
 * Legacy single-scope params (`scope`/`scopeSlug`) the entity tabs used to redirect with. Mapped onto
 * the matching facet so old bookmarked deeplinks keep working.
 */
const LEGACY_SCOPE_TO_FACET: Record<string, AutofillFacetKey> = {
  "category": "category",
  "property": "property",
  "website": "website",
  "tag": "tag",
  "media-type": "mediaType",
  "channel": "channel",
};

function trimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Validate/normalize raw search params: keep each facet slug (dropping the category `"all"` sentinel),
 * migrate a legacy `scope`+`scopeSlug` pair onto its facet, and omit empty strings so the URL stays clean.
 */
export function validateAutofillListSearch(raw: Record<string, unknown>): AutofillListSearch {
  const result: AutofillListSearch = {};

  for (const key of AUTOFILL_FACET_KEYS) {
    const value = trimmedString(raw[key]);
    if (!value) continue;
    // The "all" sentinel means "no filter"; drop it from the URL.
    if (key === "category" && value === ALL_CATEGORIES) continue;
    result[key] = value;
  }

  // Back-compat: a legacy `scope`+`scopeSlug` pair maps onto its facet (only when that facet wasn't
  // already set by a new-style param).
  const legacyScope = trimmedString(raw.scope);
  const legacyScopeSlug = trimmedString(raw.scopeSlug);
  if (legacyScope && legacyScopeSlug) {
    const facet = LEGACY_SCOPE_TO_FACET[legacyScope];
    if (facet && !result[facet]) result[facet] = legacyScopeSlug;
  }

  const q = trimmedString(raw.q);
  if (q) result.q = q;
  return result;
}
