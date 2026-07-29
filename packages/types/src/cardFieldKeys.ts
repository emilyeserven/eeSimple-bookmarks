/**
 * The fixed (non-custom-property) bookmark-card field keys, in display order — the single canonical
 * list shared by the client (`packages/client/src/lib/bookmarkCardFieldDefs.ts`, which attaches the
 * labels) and the middleware (`services/cardDisplayDefaults.ts`, which seeds the default card
 * config). Adding a card field means adding its key here; the client's exhaustive label record then
 * fails `tsc` until the label is added, so the two sides can't drift.
 */
export const STANDARD_CARD_FIELD_KEYS = [
  "title",
  "secondaryName",
  "description",
  "url",
  "secondaryUrl",
  "category",
  "website",
  "mediaType",
  "youtubeChannel",
  "tags",
  "genreMoods",
  "locations",
  "people",
  "groups",
  "taggedSections",
  "favoriteSections",
  "matchType",
  "createdAt",
  "updatedAt",
  "externalLink",
  "archiveLink",
  "kavitaLink",
  "plexLink",
  "podcastLink",
  "more",
] as const;

/** A fixed bookmark-card field key. Derived from {@link STANDARD_CARD_FIELD_KEYS}. */
export type StandardCardFieldKey = typeof STANDARD_CARD_FIELD_KEYS[number];

/** The card header field keys (title + action buttons); they default into the `card-single-top` zone. */
export const HEADER_CARD_FIELD_KEYS = ["title", "externalLink", "more"] as const;
