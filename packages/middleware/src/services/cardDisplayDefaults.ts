import type { CardFieldZones } from "@eesimple/types";
import {
  emptyCardFieldZones,
  HEADER_CARD_FIELD_KEYS as SHARED_HEADER_CARD_FIELD_KEYS,
  STANDARD_CARD_FIELD_KEYS as SHARED_STANDARD_CARD_FIELD_KEYS,
} from "@eesimple/types";

/**
 * The fixed (non-custom-property) bookmark-card field keys, in display order — spread from the
 * canonical `STANDARD_CARD_FIELD_KEYS` tuple in `@eesimple/types` (`cardFieldKeys.ts`), the same
 * list the client's `STANDARD_CARD_FIELDS` (`packages/client/src/lib/bookmarkCardFieldDefs.ts`)
 * derives its labels from — the two sides can no longer drift.
 */
export const STANDARD_CARD_FIELD_KEYS = [...SHARED_STANDARD_CARD_FIELD_KEYS] as const;

/** The card header fields (title + action buttons), which default into the `card-single-top` zone. */
export const HEADER_CARD_FIELD_KEYS = [...SHARED_HEADER_CARD_FIELD_KEYS] as const;

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
