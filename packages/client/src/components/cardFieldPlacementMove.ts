import type { CardFieldPlacement } from "@eesimple/types";

/**
 * Boolean per-field knobs copied as `true` when the previous placement had them truthy. They apply
 * in every body zone (and, for `hideLabel`/`hideIcon`, on image overlays too), so any move preserves
 * them; fields that don't read a given knob simply ignore it.
 */
const TRUTHY_KNOBS = [
  "hideLabel",
  "hideIcon",
  "showIfFalse",
  "clickableInView",
  "clickableInOverlay",
  "showValueBeforeLabel",
  "clickableTags",
  "showTagHierarchyOnHover",
  "showMediaTypeHierarchyOnHover",
  "showLocationHierarchyOnHover",
  "showGenreMoodHierarchyOnHover",
  "collapseToCount",
] as const satisfies readonly (keyof CardFieldPlacement)[];

/**
 * Knobs whose default is `true` (absent/omitted means true); only an explicit `false` is worth
 * preserving across a move.
 */
const FALSE_PRESERVING_KNOBS = [
  "showLabelColon",
  "showProgressCount",
  "showProgressUnit",
] as const satisfies readonly (keyof CardFieldPlacement)[];

/**
 * Build the placement for `key` in its destination zone, carrying over the per-field knobs from the
 * field's previous placement — plus the image-overlay scale when the destination is an image zone.
 * Pure, so it is unit-testable independently of the drag-and-drop board (`CardFieldZoneBoard`).
 */
export function carryOverPlacement(
  key: string,
  existing: CardFieldPlacement | undefined,
  isImageZone: boolean,
): CardFieldPlacement {
  const placement: CardFieldPlacement = {
    key,
  };
  if (isImageZone) {
    placement.scale = existing?.scale;
    placement.mobileScale = existing?.mobileScale;
  }
  if (!existing) return placement;
  for (const knob of TRUTHY_KNOBS) {
    if (existing[knob]) placement[knob] = true;
  }
  for (const knob of FALSE_PRESERVING_KNOBS) {
    if (existing[knob] === false) placement[knob] = false;
  }
  // Multi-value taxonomy term cap applies in every body zone; preserve an explicit value.
  if (existing.maxTerms != null) placement.maxTerms = existing.maxTerms;
  return placement;
}
