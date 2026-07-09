import type { ResolvedFieldPlacement } from "./bookmarkCardValues";
import type { FieldForm } from "./cardZoneLayoutClasses";
import type { CardDisplaySection, CardFieldZone, CardZoneLayout, CardZoneLayouts } from "@eesimple/types";

import { CARD_BODY_ZONES, normalizeCardZoneLayout } from "@eesimple/types";

import { sectionFormToFieldForm, zoneForm } from "./cardZoneLayoutClasses";

/**
 * One card-body section as {@link BookmarkCardDetails} renders it: an ordered list of field keys in a
 * given render {@link FieldForm} + {@link CardZoneLayout}. This is the single render input both the
 * legacy fixed-zone model (homepage / other surfaces) and the dynamic card-display config map onto, so
 * there stays exactly one card-body renderer. `pinBottom` reproduces the old `card-single-bottom`
 * `mt-auto` (the bottom section is pushed to the foot of a taller-than-content card).
 */
export interface RenderBodySection {
  key: string;
  form: FieldForm;
  layout: CardZoneLayout;
  fieldKeys: string[];
  pinBottom?: boolean;
}

/**
 * Derive the render sections from the legacy fixed four-zone model — one section per
 * {@link CARD_BODY_ZONES} entry, in that fixed top-to-bottom order, with `card-single-bottom` pinned.
 * This reproduces the pre-refactor card body byte-for-byte (used by homepage sections and every
 * non-listing surface).
 */
export function bodySectionsFromZones(
  placements: Map<string, ResolvedFieldPlacement>,
  cardZoneLayouts: CardZoneLayouts | undefined,
): RenderBodySection[] {
  // Group the body-placed keys by their sub-zone, preserving each zone's field order (placements is
  // built in zone-then-array order, so Map insertion order matches).
  const keysByZone = new Map<CardFieldZone, string[]>();
  for (const [key, placement] of placements) {
    if (placement.corner !== null) continue;
    const list = keysByZone.get(placement.zone) ?? [];
    list.push(key);
    keysByZone.set(placement.zone, list);
  }
  return CARD_BODY_ZONES.map(zone => ({
    key: zone,
    form: zoneForm(zone),
    layout: normalizeCardZoneLayout(cardZoneLayouts?.[zone], zone === "card-table" ? "grid" : "flex"),
    fieldKeys: keysByZone.get(zone) ?? [],
    pinBottom: zone === "card-single-bottom",
  }));
}

/**
 * Derive the render sections from the dynamic card-display {@link CardDisplaySection} model (listing
 * cards). Sections have already been filtered by their per-bookmark `visibleIf` before reaching here;
 * the last section is pinned to the card foot to preserve the default footer behavior.
 */
export function bodySectionsFromConfig(sections: CardDisplaySection[]): RenderBodySection[] {
  return sections.map((section, index) => ({
    key: section.key,
    form: sectionFormToFieldForm(section.form),
    layout: section.layout,
    fieldKeys: section.fields.map(field => field.key),
    pinBottom: index === sections.length - 1,
  }));
}
