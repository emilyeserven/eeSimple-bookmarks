import type {
  Bookmark,
  CardFieldZone,
  CardFieldZones,
  CardImageCorner,
  CustomProperty,
} from "@eesimple/types";

import { CARD_FIELD_ZONES, emptyCardFieldZones, zoneToCorner } from "@eesimple/types";

import { eligibleCustomCardFields, STANDARD_CARD_FIELDS } from "./bookmarkCardFieldDefs";
import { formatBoolean, formatBooleanBadge, formatDateTime, formatNumber } from "./bookmarkFormat";

/** The default concrete zones: every standard field + eligible custom property placed in the card body. */
export function defaultCardFieldZones(properties: CustomProperty[]): CardFieldZones {
  const zones = emptyCardFieldZones();
  zones.card = [
    ...STANDARD_CARD_FIELDS.map(field => ({
      key: field.key,
    })),
    ...eligibleCustomCardFields(properties).map(field => ({
      key: field.key,
    })),
  ];
  return zones;
}

/**
 * A field's resolved placement on a card: which zone it sits in, the corresponding image corner (or
 * `null` for the `card` body), and the overlay styling (only meaningful in image zones). A field key
 * absent from the resolved map is hidden.
 */
export interface ResolvedFieldPlacement {
  zone: CardFieldZone;
  corner: CardImageCorner | null;
  scale: number;
  mobileScale: number | null;
  hideLabel: boolean;
}

/** Build a `fieldKey → placement` lookup from a rule's {@link CardFieldZones}. Unlisted keys are hidden. */
export function resolveFieldPlacements(zones: CardFieldZones): Map<string, ResolvedFieldPlacement> {
  const map = new Map<string, ResolvedFieldPlacement>();
  for (const zone of CARD_FIELD_ZONES) {
    for (const placement of zones[zone]) {
      map.set(placement.key, {
        zone,
        corner: zoneToCorner(zone),
        scale: placement.scale ?? 1,
        mobileScale: placement.mobileScale ?? null,
        hideLabel: placement.hideLabel ?? false,
      });
    }
  }
  return map;
}

/** A placement meaning "shown in the card body" (no corner, no overlay styling). */
const CARD_PLACEMENT: ResolvedFieldPlacement = {
  zone: "card",
  corner: null,
  scale: 1,
  mobileScale: null,
  hideLabel: false,
};

/**
 * The placement lookup a card should render with. When `zones` is provided (rule-driven listings),
 * placement is strict — a field absent from every zone is hidden. When omitted (surfaces with no
 * rule, e.g. tests), every standard field and custom property defaults to the card body (show all),
 * preserving the pre-rules behavior.
 */
export function fieldPlacementsForCard(
  zones: CardFieldZones | undefined,
  properties: CustomProperty[],
): Map<string, ResolvedFieldPlacement> {
  if (zones) return resolveFieldPlacements(zones);
  const map = new Map<string, ResolvedFieldPlacement>();
  for (const field of STANDARD_CARD_FIELDS) map.set(field.key, CARD_PLACEMENT);
  for (const property of properties) map.set(property.id, CARD_PLACEMENT);
  return map;
}

/** Remove `hiddenKeys` from every zone (used to layer a surface's own visibility over rule zones). */
export function restrictFieldZones(zones: CardFieldZones, hiddenKeys: Set<string>): CardFieldZones {
  const next = {} as CardFieldZones;
  for (const zone of CARD_FIELD_ZONES) {
    next[zone] = zones[zone].filter(placement => !hiddenKeys.has(placement.key));
  }
  return next;
}

/** Collapse all image-corner placements into the card body (used when a surface disables overlays). */
export function flattenFieldZonesToCard(zones: CardFieldZones): CardFieldZones {
  const next = {} as CardFieldZones;
  next.card = CARD_FIELD_ZONES.flatMap(zone => zones[zone].map(placement => ({
    key: placement.key,
  })));
  for (const zone of CARD_FIELD_ZONES) {
    if (zone !== "card") next[zone] = [];
  }
  return next;
}

/**
 * A single custom-property value ready to render on a bookmark card. `kind` discriminates how it is
 * shown: a text `badge` (number/boolean/datetime) or a star `rating`. `corner` (and the overlay
 * `scale`/`mobileScale`) carry the rule's chosen placement so the card can decide between overlaying
 * the value on the image and rendering it in the card body.
 */
export type BookmarkValueItem
  = | {
    kind: "badge";
    id: string;
    property: CustomProperty;
    corner: CardImageCorner | null;
    scale: number;
    mobileScale: number | null;
    label: string;
    /** Present for boolean values, so the card can wire an inline toggle for `clickableInView`. */
    booleanValue?: boolean;
  }
  | {
    kind: "rating";
    id: string;
    property: CustomProperty;
    corner: CardImageCorner | null;
    scale: number;
    mobileScale: number | null;
    value: number;
  };

/**
 * Build the ordered list of render-ready custom-property value items for a bookmark, honoring each
 * property's `showInListings` / `showIfFalse` and the rule's `placements` (a property absent from the
 * placement map is hidden). The single source of truth shared by the badge list
 * (`BookmarkCardDetails`) and the image-corner overlays (`BookmarkCard`) so the two never disagree
 * about which value renders where. Rating-scale values are `rating` items; number/boolean/datetime
 * values are `badge` items.
 */
export function buildBookmarkValueItems(
  bookmark: Bookmark,
  properties: CustomProperty[],
  placements: Map<string, ResolvedFieldPlacement>,
): BookmarkValueItem[] {
  const byId = new Map(properties.map(property => [property.id, property]));
  const items: BookmarkValueItem[] = [];

  for (const entry of bookmark.numberValues) {
    const property = byId.get(entry.propertyId);
    const placement = placements.get(entry.propertyId);
    if (!property || !property.showInListings || !placement) continue;
    if (property.type === "ratingScale") {
      items.push({
        kind: "rating",
        id: entry.propertyId,
        property,
        corner: placement.corner,
        scale: placement.scale,
        mobileScale: placement.mobileScale,
        value: entry.value,
      });
    }
    else {
      items.push({
        kind: "badge",
        id: entry.propertyId,
        property,
        corner: placement.corner,
        scale: placement.scale,
        mobileScale: placement.mobileScale,
        label: placement.hideLabel
          ? formatNumber(entry.value, property)
          : `${property.name}: ${formatNumber(entry.value, property)}`,
      });
    }
  }

  for (const entry of bookmark.booleanValues) {
    const property = byId.get(entry.propertyId);
    const placement = placements.get(entry.propertyId);
    if (!property || !property.showInListings || !placement) continue;
    if (!entry.value && !property.showIfFalse) continue;
    items.push({
      kind: "badge",
      id: entry.propertyId,
      property,
      corner: placement.corner,
      scale: placement.scale,
      mobileScale: placement.mobileScale,
      label: placement.hideLabel
        ? formatBoolean(entry.value, property)
        : formatBooleanBadge(entry.value, property),
      booleanValue: entry.value,
    });
  }

  for (const entry of bookmark.dateTimeValues) {
    const property = byId.get(entry.propertyId);
    const placement = placements.get(entry.propertyId);
    if (!property || !property.showInListings || !placement) continue;
    items.push({
      kind: "badge",
      id: entry.propertyId,
      property,
      corner: placement.corner,
      scale: placement.scale,
      mobileScale: placement.mobileScale,
      label: placement.hideLabel
        ? formatDateTime(entry.value, property)
        : `${property.name}: ${formatDateTime(entry.value, property)}`,
    });
  }

  for (const entry of bookmark.fileValues) {
    const property = byId.get(entry.propertyId);
    const placement = placements.get(entry.propertyId);
    if (!property || !property.showInListings || !placement) continue;
    // Image/file values render as a text badge on cards (the thumbnail/download link lives in the
    // detail view). Images show just the property name; files append their original filename.
    const label = property.type === "image"
      ? property.name
      : `${property.name}: ${entry.originalFilename ?? "file"}`;
    items.push({
      kind: "badge",
      id: entry.propertyId,
      property,
      corner: placement.corner,
      scale: placement.scale,
      mobileScale: placement.mobileScale,
      label,
    });
  }

  return items;
}

/**
 * The four image corners, in DOM order, paired with their absolute-positioning classes and the CSS
 * `transform-origin` to anchor a scaled overlay at that corner so it grows inward from the edge.
 */
export const CARD_IMAGE_CORNERS: { corner: CardImageCorner;
  className: string;
  transformOrigin: string; }[] = [
  {
    corner: "top-left",
    className: "left-1 top-1 items-start",
    transformOrigin: "top left",
  },
  {
    corner: "top-right",
    className: "right-1 top-1 items-end",
    transformOrigin: "top right",
  },
  {
    corner: "bottom-left",
    className: "bottom-1 left-1 items-start",
    transformOrigin: "bottom left",
  },
  {
    corner: "bottom-right",
    className: "bottom-1 right-1 items-end",
    transformOrigin: "bottom right",
  },
];

/**
 * The overlay label for a standard (non-custom-property) field placed in an image corner, or `null`
 * when the bookmark has nothing to show for it. Custom-property overlays come from
 * {@link buildBookmarkValueItems}; this covers the standard fields.
 */
export function standardFieldOverlayLabel(
  bookmark: Bookmark,
  key: string,
  categoryName: string | null,
): string | null {
  switch (key) {
    case "description": return bookmark.description || null;
    case "category": return categoryName;
    case "website": return bookmark.website?.siteName ?? null;
    case "mediaType": return bookmark.mediaType?.name ?? null;
    case "youtubeChannel": return bookmark.youtubeChannel?.name ?? null;
    case "tags": return bookmark.tags.length > 0 ? bookmark.tags.map(tag => tag.name).join(", ") : null;
    default: return null;
  }
}
