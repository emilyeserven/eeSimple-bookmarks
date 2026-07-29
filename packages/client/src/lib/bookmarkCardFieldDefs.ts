import type { CustomProperty, StandardCardFieldKey } from "@eesimple/types";

import { STANDARD_CARD_FIELD_KEYS } from "@eesimple/types";

/**
 * Display label for each fixed card-field key. The keys are the canonical shared tuple
 * (`STANDARD_CARD_FIELD_KEYS` in `@eesimple/types`, also consumed by the middleware's
 * `cardDisplayDefaults.ts`); the exhaustive `satisfies` makes a key added there fail `tsc` here
 * until it gets a label.
 */
const STANDARD_CARD_FIELD_LABELS = {
  title: "Title",
  secondaryName: "Secondary Title",
  description: "Description",
  url: "URL",
  secondaryUrl: "Download URL",
  category: "Category",
  website: "Website",
  mediaType: "Media Type",
  youtubeChannel: "YouTube Channel",
  tags: "Tags",
  genreMoods: "Genres & Moods",
  locations: "Locations",
  people: "People",
  groups: "Groups",
  taggedSections: "Tagged Sections",
  favoriteSections: "Favorite Sections",
  matchType: "Match Type",
  createdAt: "Date Added",
  updatedAt: "Date Updated",
  externalLink: "Open Link",
  archiveLink: "Archive Link",
  kavitaLink: "Kavita Link",
  plexLink: "Plex Link",
  podcastLink: "Podcast Link",
  more: "More menu",
} satisfies Record<StandardCardFieldKey, string>;

/**
 * The fixed (non-custom-property) fields a bookmark card can show, in display order. Custom
 * properties extend this list (keyed by id). Pure (no hooks) so it can be shared by the rendering
 * pipeline and the rule editor without an import cycle; the hook-backed helpers live in
 * `bookmarkCardFields.ts`, which re-exports this. Derived from the shared
 * `STANDARD_CARD_FIELD_KEYS` tuple (`@eesimple/types`) — one canonical key list for client and
 * middleware.
 */
export const STANDARD_CARD_FIELDS: readonly { key: StandardCardFieldKey;
  label: string; }[] = STANDARD_CARD_FIELD_KEYS.map(key => ({
  key,
  label: STANDARD_CARD_FIELD_LABELS[key],
}));

/** The card header field keys (title + action buttons); they default into the `card-single-top` zone. */
export { HEADER_CARD_FIELD_KEYS } from "@eesimple/types";

/**
 * The taxonomy fields that can hold multiple terms — the ones that support the per-field term-display
 * knobs (`maxTerms` / `collapseToCount`): a cap on visible names or a collapse to the icon + count.
 * Single-value taxonomy fields (category, website, media type, YouTube channel) are excluded.
 */
export const MULTI_VALUE_TAXONOMY_FIELD_KEYS = [
  "tags",
  "people",
  "groups",
  "genreMoods",
  "locations",
] as const;

/** Whether `key` is a multi-value taxonomy field (supports the term-display knobs). */
export function isMultiValueTaxonomyField(key: string): boolean {
  return (MULTI_VALUE_TAXONOMY_FIELD_KEYS as readonly string[]).includes(key);
}

/**
 * The custom properties eligible to appear on bookmark cards (and thus in the rule's field zones):
 * shown in listings and not a calculate property. Category scope is intentionally *not* a gate — a
 * property with no explicit `categoryIds` applies to every category (see `propertyAppliesToCategory`
 * in `@eesimple/types`), so it is card-eligible like any category-scoped one; the runtime per-card
 * scope check still limits where a scoped property actually renders. Returned as `{ key, label }`
 * pairs keyed by property id, ready to merge after {@link STANDARD_CARD_FIELDS}.
 */
export function eligibleCustomCardFields(
  properties: CustomProperty[],
): { key: string;
  label: string; }[] {
  return properties
    .filter(property =>
      property.showInListings
      && property.type !== "calculate")
    .map(property => ({
      key: property.id,
      label: property.name,
    }));
}
