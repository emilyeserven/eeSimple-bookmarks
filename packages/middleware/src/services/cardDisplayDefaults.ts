import type { CardFieldZones } from "@eesimple/types";
import { emptyCardFieldZones } from "@eesimple/types";

/**
 * The fixed (non-custom-property) bookmark-card field keys, in display order. Mirrors the client's
 * `STANDARD_CARD_FIELDS` (`packages/client/src/lib/bookmarkCardFields.ts`) — keep the two in sync.
 */
export const STANDARD_CARD_FIELD_KEYS = [
  "description",
  "category",
  "website",
  "mediaType",
  "youtubeChannel",
  "tags",
] as const;

/**
 * The card-body sub-zone a standard/custom field lands in by default: the long-text `description`
 * reads best as a full-width row (`card-single-top`); everything else uses its pill/badge form in
 * `card-labels`. Shared by the Default-rule seed and the boot backfills so seeded and migrated rules
 * agree.
 */
export function defaultBodyZone(key: string): "card-single-top" | "card-labels" {
  return key === "description" ? "card-single-top" : "card-labels";
}

/**
 * The baseline {@link CardFieldZones} for the seeded Default rule: each standard field placed in its
 * {@link defaultBodyZone}, all image corners empty. Custom-property placements are filled in by the
 * boot backfill (`backfillCardDisplayRuleFieldZones`) from legacy data, or default to `card-labels`.
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
