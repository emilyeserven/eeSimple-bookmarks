import type {
  Bookmark,
  CardFieldZone,
  CardFieldZones,
  CardImageCorner,
  CustomProperty,
} from "@eesimple/types";

import { CARD_BODY_ZONES, CARD_FIELD_ZONES, emptyCardFieldZones, zoneToCorner } from "@eesimple/types";

import { eligibleCustomCardFields, STANDARD_CARD_FIELDS } from "./bookmarkCardFieldDefs";
import { formatBoolean, formatBooleanBadge, formatDateTime, formatNumber } from "./bookmarkFormat";

/**
 * The card-body sub-zone a field lands in by default: the long-text `description` reads best as a
 * full-width row (`card-single-top`); everything else uses its pill/badge form in `card-labels`.
 * Mirrors the middleware's `defaultBodyZone` so seeded/migrated and client-default zones agree.
 */
export function defaultBodyZone(key: string): CardFieldZone {
  return key === "description" ? "card-single-top" : "card-labels";
}

/** The default concrete zones: every standard field + eligible custom property placed in the card body. */
export function defaultCardFieldZones(properties: CustomProperty[]): CardFieldZones {
  const zones = emptyCardFieldZones();
  for (const field of STANDARD_CARD_FIELDS) {
    zones[defaultBodyZone(field.key)].push({
      key: field.key,
    });
  }
  for (const field of eligibleCustomCardFields(properties)) {
    zones[defaultBodyZone(field.key)].push({
      key: field.key,
    });
  }
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
  hideIcon: boolean;
}

/** Build a `fieldKey → placement` lookup from a rule's {@link CardFieldZones}. Unlisted keys are hidden. */
export function resolveFieldPlacements(zones: CardFieldZones): Map<string, ResolvedFieldPlacement> {
  const map = new Map<string, ResolvedFieldPlacement>();
  for (const zone of CARD_FIELD_ZONES) {
    // A row read before the boot sub-zone backfill can be missing newer keys; treat absent as empty.
    for (const placement of zones[zone] ?? []) {
      map.set(placement.key, {
        zone,
        corner: zoneToCorner(zone),
        scale: placement.scale ?? 1,
        mobileScale: placement.mobileScale ?? null,
        hideLabel: placement.hideLabel ?? false,
        hideIcon: placement.hideIcon ?? false,
      });
    }
  }
  return map;
}

/** A placement meaning "shown in the card body" (default labels sub-zone, no overlay styling). */
const CARD_PLACEMENT: ResolvedFieldPlacement = {
  zone: "card-labels",
  corner: null,
  scale: 1,
  mobileScale: null,
  hideLabel: false,
  hideIcon: false,
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

/**
 * Collapse the image-corner placements into the card body (used when a surface disables overlays).
 * The four card-body sub-zones keep their fields/order; corner fields are appended to the labels zone
 * (their overlay styling dropped).
 */
export function flattenFieldZonesToCard(zones: CardFieldZones): CardFieldZones {
  const next = emptyCardFieldZones();
  for (const zone of CARD_BODY_ZONES) {
    next[zone] = zones[zone].map(placement => ({
      ...placement,
    }));
  }
  for (const zone of CARD_FIELD_ZONES) {
    if (zoneToCorner(zone) === null) continue;
    for (const placement of zones[zone]) {
      next["card-labels"].push({
        key: placement.key,
      });
    }
  }
  return next;
}

/**
 * A single custom-property value ready to render on a bookmark card. `kind` discriminates how it is
 * shown: a text `badge` (number/boolean/datetime) or a star `rating`. `corner` (and the overlay
 * `scale`/`mobileScale`) carry the rule's chosen placement so the card can decide between overlaying
 * the value on the image and rendering it in the card body.
 */
interface BookmarkValueItemBase {
  id: string;
  property: CustomProperty;
  /** The body sub-zone or image corner the value is placed in. */
  zone: CardFieldZone;
  corner: CardImageCorner | null;
  scale: number;
  mobileScale: number | null;
  /** Drop the field's name label (overlays + the `card-table` zone). */
  hideLabel: boolean;
  /** Drop the field's icon/image from an overlay. */
  hideIcon: boolean;
}

export type BookmarkValueItem
  = | (BookmarkValueItemBase & {
    kind: "badge";
    /** Inline label honoring `hideLabel` ("Name: value" or just "value"); used by the pill/overlay forms. */
    label: string;
    /** The property's display name (left column of the `card-table` form). */
    name: string;
    /** The bare formatted value (right column of the `card-table` form); empty for an image value. */
    value: string;
    /** Serving URL for an `image`-type value, so overlays/table can show a thumbnail. */
    imageUrl?: string;
    /** Present for boolean values, so the card can wire an inline toggle for `clickableInView`. */
    booleanValue?: boolean;
  })
  | (BookmarkValueItemBase & {
    kind: "rating";
    value: number;
  });

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

  /** Shared placement fields every value item carries. */
  const base = (
    property: CustomProperty,
    placement: ResolvedFieldPlacement,
  ): BookmarkValueItemBase => ({
    id: property.id,
    property,
    zone: placement.zone,
    corner: placement.corner,
    scale: placement.scale,
    mobileScale: placement.mobileScale,
    hideLabel: placement.hideLabel,
    hideIcon: placement.hideIcon,
  });

  for (const entry of bookmark.numberValues) {
    const property = byId.get(entry.propertyId);
    const placement = placements.get(entry.propertyId);
    if (!property || !property.showInListings || !placement) continue;
    if (property.type === "ratingScale") {
      items.push({
        ...base(property, placement),
        kind: "rating",
        value: entry.value,
      });
    }
    else {
      const value = formatNumber(entry.value, property);
      items.push({
        ...base(property, placement),
        kind: "badge",
        label: placement.hideLabel ? value : `${property.name}: ${value}`,
        name: property.name,
        value,
      });
    }
  }

  for (const entry of bookmark.booleanValues) {
    const property = byId.get(entry.propertyId);
    const placement = placements.get(entry.propertyId);
    if (!property || !property.showInListings || !placement) continue;
    if (!entry.value && !property.showIfFalse) continue;
    items.push({
      ...base(property, placement),
      kind: "badge",
      label: placement.hideLabel
        ? formatBoolean(entry.value, property)
        : formatBooleanBadge(entry.value, property),
      name: property.name,
      value: formatBoolean(entry.value, property),
      booleanValue: entry.value,
    });
  }

  for (const entry of bookmark.dateTimeValues) {
    const property = byId.get(entry.propertyId);
    const placement = placements.get(entry.propertyId);
    if (!property || !property.showInListings || !placement) continue;
    const value = formatDateTime(entry.value, property);
    items.push({
      ...base(property, placement),
      kind: "badge",
      label: placement.hideLabel ? value : `${property.name}: ${value}`,
      name: property.name,
      value,
    });
  }

  for (const entry of bookmark.fileValues) {
    const property = byId.get(entry.propertyId);
    const placement = placements.get(entry.propertyId);
    if (!property || !property.showInListings || !placement) continue;
    // Image values show just the property name (their thumbnail can be overlaid); files append the
    // original filename. The image's serving URL is carried so overlays/table can show a thumbnail.
    const isImage = property.type === "image";
    const value = isImage ? "" : (entry.originalFilename ?? "file");
    const label = isImage
      ? property.name
      : (placement.hideLabel ? value : `${property.name}: ${value}`);
    items.push({
      ...base(property, placement),
      kind: "badge",
      label,
      name: property.name,
      value,
      imageUrl: isImage ? entry.url : undefined,
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
