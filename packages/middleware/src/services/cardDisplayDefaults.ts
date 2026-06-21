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
 * The baseline {@link CardFieldZones} for the seeded Default rule: every standard field placed in the
 * `card` zone, all image corners empty. Custom-property placements are filled in by the boot backfill
 * (`backfillCardDisplayRuleFieldZones`) from legacy data, or default to the `card` zone afterward.
 */
export function defaultFieldZones(): CardFieldZones {
  const zones = emptyCardFieldZones();
  zones.card = STANDARD_CARD_FIELD_KEYS.map(key => ({
    key,
  }));
  return zones;
}
