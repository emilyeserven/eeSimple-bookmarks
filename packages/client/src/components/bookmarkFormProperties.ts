import type { BookmarkAddFormPlacement, CustomProperty } from "@eesimple/types";

import { propertyAppliesToCategory, propertyAppliesToMediaType } from "@eesimple/types";

/** Where in the form a property list is being rendered — decides which visibility flag gates it. */
export type PropertyPlacement = "default" | "advanced" | "details" | "all";

export interface SelectFormPropertiesOptions {
  categoryId: string;
  /** The bookmark's media type, if any; a property scoped to it also shows (union with category). */
  mediaTypeId: string | null;
  placement: PropertyPlacement;
  /** Slugs dropped from rendering entirely (their value is still submitted/derived). */
  hiddenSlugs?: string[];
  /** When provided, restrict to this group (`null` = ungrouped); omit to ignore grouping. */
  groupId?: string | null;
  /**
   * Per-slug placement overrides from the Add Bookmark Form settings (Settings → Display), passed
   * only by create-mode callers. Checked after the scope/`enabled`/`hiddenFromForm`/`hiddenSlugs`
   * gates and before the `showInForm` placement branch:
   * - An override of `"hidden"` drops the property, same as `hiddenSlugs`.
   * - An override of `"default"` or `"advanced"` decides membership for the `"default"`/
   *   `"advanced"` placements in place of `property.showInForm` — the property shows iff the
   *   override matches the call's `placement`. The group filter still applies as normal.
   * - A slug with no entry in the map falls through to the existing `showInForm` behavior.
   * - Overrides only affect the `"default"`/`"advanced"` placements (plus the universal `"hidden"`
   *   drop, which is gated on the option being provided at all); `"details"`/`"all"` placements are
   *   edit/detail surfaces that create-mode callers never pass alongside overrides, so they ignore
   *   this option entirely.
   * `hiddenFromForm` still wins over any override — it is checked first and unconditionally drops
   * the property, so an override can never resurrect a `hiddenFromForm` property.
   */
  placementOverrides?: Record<string, BookmarkAddFormPlacement>;
}

/**
 * The subset of `properties` that should render for one form surface, given the bookmark's category
 * and media type, the placement (`default`/`advanced`/`details`/`all`), the hidden-slug list, an
 * optional property-group filter, and optional per-slug placement overrides. Pure — extracted from
 * `CategoryCustomFields` so the multi-clause gating is unit-testable and doesn't inflate the
 * component's complexity.
 */
export function selectVisibleFormProperties(
  properties: CustomProperty[],
  {
    categoryId, mediaTypeId, placement, hiddenSlugs, groupId, placementOverrides,
  }: SelectFormPropertiesOptions,
): CustomProperty[] {
  return properties.filter((property) => {
    // Union scoping: a property shows if it applies to the bookmark's category OR its media type.
    if (
      !propertyAppliesToCategory(property, categoryId)
      && !propertyAppliesToMediaType(property, mediaTypeId)
    ) return false;
    if (!property.enabled) return false;
    // hiddenFromForm drops the field entirely; otherwise showInForm chooses the main area vs. Advanced.
    if (property.hiddenFromForm) return false;
    // Slugs the form fills server-side (e.g. Runtime) are hidden but still persisted.
    if (hiddenSlugs?.includes(property.slug)) return false;
    const override = placementOverrides?.[property.slug];
    if (override === "hidden") return false;
    if (placement === "details") return property.showInDetails;
    if (placement === "all") {
      // Group filter: when groupId is provided, restrict to that group (null = ungrouped).
      if (groupId !== undefined) return property.propertyGroupId === groupId;
      return true;
    }
    // Group filter applied after placement check.
    if (groupId !== undefined && property.propertyGroupId !== groupId) return false;
    if (override === "default" || override === "advanced") return override === placement;
    return placement === "default" ? property.showInForm : !property.showInForm;
  });
}
