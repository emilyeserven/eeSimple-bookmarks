import type { CardFieldPlacement } from "@eesimple/types";

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
  if (existing?.hideLabel) placement.hideLabel = true;
  // hideIcon applies to image overlays and to boolean body fields (icon/stars presets), so it is
  // preserved across any move; fields that don't read it simply ignore it.
  if (existing?.hideIcon) placement.hideIcon = true;
  // Preserve the boolean per-field knobs across a move (they apply in every body zone).
  if (existing?.showIfFalse) placement.showIfFalse = true;
  if (existing?.clickableInView) placement.clickableInView = true;
  if (existing?.clickableInOverlay) placement.clickableInOverlay = true;
  if (existing?.showLabelColon === false) placement.showLabelColon = false;
  if (existing?.showValueBeforeLabel) placement.showValueBeforeLabel = true;
  if (existing?.clickableTags) placement.clickableTags = true;
  if (existing?.showTagHierarchyOnHover) placement.showTagHierarchyOnHover = true;
  if (existing?.showMediaTypeHierarchyOnHover) placement.showMediaTypeHierarchyOnHover = true;
  if (existing?.showLocationHierarchyOnHover) placement.showLocationHierarchyOnHover = true;
  if (existing?.showGenreMoodHierarchyOnHover) placement.showGenreMoodHierarchyOnHover = true;
  // Multi-value taxonomy term-display knobs apply in every body zone; preserve them across a move.
  if (existing?.maxTerms != null) placement.maxTerms = existing.maxTerms;
  if (existing?.collapseToCount) placement.collapseToCount = true;
  return placement;
}
