import type { CardFieldZones } from "@eesimple/types";
import { emptyCardFieldZones } from "@eesimple/types";

/**
 * The fixed (non-custom-property) bookmark-card field keys, in display order. Mirrors the client's
 * `STANDARD_CARD_FIELDS` (`packages/client/src/lib/bookmarkCardFields.ts`) — keep the two in sync.
 */
export const STANDARD_CARD_FIELD_KEYS = [
  "title",
  "secondaryName",
  "description",
  "category",
  "website",
  "mediaType",
  "youtubeChannel",
  "tags",
  "genreMoods",
  "locations",
  "people",
  "groups",
  "externalLink",
  "archiveLink",
  "kavitaLink",
  "plexLink",
  "podcastLink",
  "more",
] as const;

/** The card header fields (title + action buttons), which default into the `card-single-top` zone. */
export const HEADER_CARD_FIELD_KEYS = ["title", "externalLink", "more"] as const;

/**
 * The card-body sub-zone a standard/custom field lands in by default: the header fields (`title`,
 * `externalLink`, `more`) and the long-text `description` read best as full-width rows
 * (`card-single-top`); everything else uses its pill/badge form in `card-labels`. Shared by the
 * Default-rule seed and the boot backfills so seeded and migrated rules agree.
 */
export function defaultBodyZone(key: string): "card-single-top" | "card-labels" {
  return key === "description" || key === "secondaryName"
    || (HEADER_CARD_FIELD_KEYS as readonly string[]).includes(key)
    ? "card-single-top"
    : "card-labels";
}

/**
 * The baseline {@link CardFieldZones} for the seeded Default rule: each standard field placed in its
 * {@link defaultBodyZone}, all image corners empty. Custom-property placements a user adds default to
 * `card-labels` via {@link defaultBodyZone}.
 */
export function defaultFieldZones(): CardFieldZones {
  const zones = emptyCardFieldZones();
  for (const key of STANDARD_CARD_FIELD_KEYS) {
    zones[defaultBodyZone(key)].push({
      key,
    });
  }
  return zones;
}
