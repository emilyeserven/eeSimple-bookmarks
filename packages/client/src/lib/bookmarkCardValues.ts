import type {
  Bookmark,
  CardFieldZone,
  CardFieldZones,
  CardImageCorner,
  CustomProperty,
} from "@eesimple/types";

import { CARD_BODY_ZONES, CARD_FIELD_ZONES, emptyCardFieldZones, zoneToCorner } from "@eesimple/types";

import { eligibleCustomCardFields, HEADER_CARD_FIELD_KEYS, STANDARD_CARD_FIELDS } from "./bookmarkCardFieldDefs";
import { formatBoolean, formatBooleanBadge, formatChoices, formatDateTime, formatNumber } from "./bookmarkFormat";
import i18n from "../i18n";

/**
 * The card-body sub-zone a field lands in by default: the header fields (`title`, `externalLink`,
 * `more`) and the long-text `description` read best as full-width rows (`card-single-top`); everything
 * else uses its pill/badge form in `card-labels`. Mirrors the middleware's `defaultBodyZone` so
 * seeded/migrated and client-default zones agree.
 */
export function defaultBodyZone(key: string): CardFieldZone {
  return key === "description" || key === "romanizedName"
    || (HEADER_CARD_FIELD_KEYS as readonly string[]).includes(key)
    ? "card-single-top"
    : "card-labels";
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
  /** Boolean fields: render the value even when false (otherwise a false value hides the field). */
  showIfFalse: boolean;
  /** Boolean fields: the value can be clicked to toggle it without entering edit mode. */
  clickableInView: boolean;
  /** Image zones: the corner badge is a link to the entity's view page (category / website / media type / channel). */
  clickableInOverlay: boolean;
  /** Boolean icon-preset fields: show the colon after the label (defaults to true). */
  showLabelColon: boolean;
  /** Boolean icon-preset fields: render the value before the label. */
  showValueBeforeLabel: boolean;
  /** Tags field in the `card-table` zone: render the tag names as clickable links to each tag's page. */
  clickableTags: boolean;
  /** Tags field, any zone: show the tag's ancestor chain in a hover popover. */
  showTagHierarchyOnHover: boolean;
  /** Media Type field, any zone: show the media type's ancestor chain in a hover popover. */
  showMediaTypeHierarchyOnHover: boolean;
  /** Locations field, any zone: show a location's ancestor chain in a hover popover. */
  showLocationHierarchyOnHover: boolean;
  /** Genres & Moods field, any zone: show a genre/mood's ancestor chain in a hover popover. */
  showGenreMoodHierarchyOnHover: boolean;
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
        showIfFalse: placement.showIfFalse ?? false,
        clickableInView: placement.clickableInView ?? false,
        clickableInOverlay: placement.clickableInOverlay ?? false,
        showLabelColon: placement.showLabelColon ?? true,
        showValueBeforeLabel: placement.showValueBeforeLabel ?? false,
        clickableTags: placement.clickableTags ?? false,
        showTagHierarchyOnHover: placement.showTagHierarchyOnHover ?? false,
        showMediaTypeHierarchyOnHover: placement.showMediaTypeHierarchyOnHover ?? false,
        showLocationHierarchyOnHover: placement.showLocationHierarchyOnHover ?? false,
        showGenreMoodHierarchyOnHover: placement.showGenreMoodHierarchyOnHover ?? false,
      });
    }
  }
  return map;
}

/** A placement meaning "shown in the card body" at `zone`, no overlay styling, all boolean knobs default. */
function bodyPlacement(zone: CardFieldZone): ResolvedFieldPlacement {
  return {
    zone,
    corner: null,
    scale: 1,
    mobileScale: null,
    hideLabel: false,
    hideIcon: false,
    showIfFalse: false,
    clickableInView: false,
    clickableInOverlay: false,
    showLabelColon: true,
    showValueBeforeLabel: false,
    clickableTags: false,
    showTagHierarchyOnHover: false,
    showMediaTypeHierarchyOnHover: false,
    showLocationHierarchyOnHover: false,
    showGenreMoodHierarchyOnHover: false,
  };
}

/**
 * The placement lookup a card should render with. When `zones` is provided (rule-driven listings),
 * placement is strict — a field absent from every zone is hidden. When omitted (surfaces with no
 * rule, e.g. tests), every standard field and custom property defaults to its {@link defaultBodyZone}
 * (show all), preserving the pre-rules behavior (and rendering the header fields as a heading row).
 */
export function fieldPlacementsForCard(
  zones: CardFieldZones | undefined,
  properties: CustomProperty[],
): Map<string, ResolvedFieldPlacement> {
  if (zones) return resolveFieldPlacements(zones);
  const map = new Map<string, ResolvedFieldPlacement>();
  for (const field of STANDARD_CARD_FIELDS) map.set(field.key, bodyPlacement(defaultBodyZone(field.key)));
  for (const property of properties) map.set(property.id, bodyPlacement(defaultBodyZone(property.id)));
  return map;
}

/** The resolved per-field boolean display knobs, used by non-listing surfaces via the Default rule. */
export interface ResolvedBooleanDisplay {
  hideLabel: boolean;
  hideIcon: boolean;
  showIfFalse: boolean;
  clickableInView: boolean;
  showLabelColon: boolean;
  showValueBeforeLabel: boolean;
}

/** Default boolean-display knobs for a property absent from the (Default) rule's zones. */
export const DEFAULT_BOOLEAN_DISPLAY: ResolvedBooleanDisplay = {
  hideLabel: false,
  hideIcon: false,
  showIfFalse: false,
  clickableInView: false,
  showLabelColon: true,
  showValueBeforeLabel: false,
};

/**
 * Resolve a boolean property's display knobs from a {@link CardFieldZones} (the **Default** rule for
 * non-listing surfaces). Returns the defaults when the property isn't placed in any zone.
 */
export function resolveBooleanDisplay(
  zones: CardFieldZones | undefined,
  propertyId: string,
): ResolvedBooleanDisplay {
  const placement = zones ? resolveFieldPlacements(zones).get(propertyId) : undefined;
  if (!placement) return DEFAULT_BOOLEAN_DISPLAY;
  return {
    hideLabel: placement.hideLabel,
    hideIcon: placement.hideIcon,
    showIfFalse: placement.showIfFalse,
    clickableInView: placement.clickableInView,
    showLabelColon: placement.showLabelColon,
    showValueBeforeLabel: placement.showValueBeforeLabel,
  };
}

/**
 * The set of known field keys (standard fields + eligible custom properties) **absent** from every
 * zone — i.e. hidden. Used by surfaces that drive a column list off "what the cards hide" (the
 * homepage section table view) so the table and the cards agree on visibility.
 */
export function hiddenFieldKeysFromZones(
  zones: CardFieldZones,
  properties: CustomProperty[],
): Set<string> {
  const present = new Set<string>();
  for (const zone of CARD_FIELD_ZONES) {
    for (const placement of zones[zone] ?? []) present.add(placement.key);
  }
  const hidden = new Set<string>();
  for (const field of STANDARD_CARD_FIELDS) if (!present.has(field.key)) hidden.add(field.key);
  for (const field of eligibleCustomCardFields(properties)) if (!present.has(field.key)) hidden.add(field.key);
  return hidden;
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
  /** Boolean fields: the value can be clicked to toggle it (from the placement, not the property). */
  clickableInView: boolean;
  /** Image zones: the corner badge is a link to the entity's view page. */
  clickableInOverlay: boolean;
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

/** Shared placement fields every value item carries. */
function placementBase(
  property: CustomProperty,
  placement: ResolvedFieldPlacement,
): BookmarkValueItemBase {
  return {
    id: property.id,
    property,
    zone: placement.zone,
    corner: placement.corner,
    scale: placement.scale,
    mobileScale: placement.mobileScale,
    hideLabel: placement.hideLabel,
    hideIcon: placement.hideIcon,
    clickableInView: placement.clickableInView,
    clickableInOverlay: placement.clickableInOverlay,
  };
}

/** A number/rating value → a `rating` item for rating-scale props, otherwise a number `badge`. */
function numberValueItem(
  entry: Bookmark["numberValues"][number],
  property: CustomProperty,
  placement: ResolvedFieldPlacement,
): BookmarkValueItem {
  if (property.type === "ratingScale") {
    return {
      ...placementBase(property, placement),
      kind: "rating",
      value: entry.value,
    };
  }
  const value = formatNumber(entry.value, property);
  return {
    ...placementBase(property, placement),
    kind: "badge",
    label: placement.hideLabel ? value : `${property.name}: ${value}`,
    name: property.name,
    value,
  };
}

/** A boolean value → a `badge`, or `null` when it is false and the prop doesn't show false. */
function booleanValueItem(
  entry: Bookmark["booleanValues"][number],
  property: CustomProperty,
  placement: ResolvedFieldPlacement,
): BookmarkValueItem | null {
  if (!entry.value && !placement.showIfFalse) return null;
  return {
    ...placementBase(property, placement),
    kind: "badge",
    label: placement.hideLabel
      ? formatBoolean(entry.value, property, {
        hideIcon: placement.hideIcon,
      })
      : formatBooleanBadge(entry.value, property, {
        hideIcon: placement.hideIcon,
        showLabelColon: placement.showLabelColon,
        showValueBeforeLabel: placement.showValueBeforeLabel,
      }),
    name: property.name,
    value: formatBoolean(entry.value, property, {
      hideIcon: placement.hideIcon,
    }),
    booleanValue: entry.value,
  };
}

/** A datetime value → a formatted `badge`. */
function dateTimeValueItem(
  entry: Bookmark["dateTimeValues"][number],
  property: CustomProperty,
  placement: ResolvedFieldPlacement,
): BookmarkValueItem {
  const value = formatDateTime(entry.value, property);
  return {
    ...placementBase(property, placement),
    kind: "badge",
    label: placement.hideLabel ? value : `${property.name}: ${value}`,
    name: property.name,
    value,
  };
}

/** A choices value → a formatted `badge`, or `null` when no option is selected. */
function choicesValueItem(
  entry: Bookmark["choicesValues"][number],
  property: CustomProperty,
  placement: ResolvedFieldPlacement,
): BookmarkValueItem | null {
  if (entry.values.length === 0) return null;
  const value = formatChoices(entry.values, property);
  return {
    ...placementBase(property, placement),
    kind: "badge",
    label: placement.hideLabel ? value : `${property.name}: ${value}`,
    name: property.name,
    value,
  };
}

/** An image/file value → a `badge`. Image values carry a serving url and show only the prop name. */
function fileValueItem(
  entry: Bookmark["fileValues"][number],
  property: CustomProperty,
  placement: ResolvedFieldPlacement,
): BookmarkValueItem {
  const isImage = property.type === "image";
  const value = isImage ? "" : (entry.originalFilename ?? i18n.t("file"));
  const label = isImage
    ? property.name
    : (placement.hideLabel ? value : `${property.name}: ${value}`);
  return {
    ...placementBase(property, placement),
    kind: "badge",
    label,
    name: property.name,
    value,
    imageUrl: isImage ? entry.url : undefined,
  };
}

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

  /** Resolve a value entry to its visible property + placement, or `null` if it should be skipped. */
  function visible(propertyId: string): { property: CustomProperty;
    placement: ResolvedFieldPlacement; } | null {
    const property = byId.get(propertyId);
    const placement = placements.get(propertyId);
    if (!property || !property.showInListings || !placement) return null;
    return {
      property,
      placement,
    };
  }

  for (const entry of bookmark.numberValues) {
    const ctx = visible(entry.propertyId);
    if (ctx) items.push(numberValueItem(entry, ctx.property, ctx.placement));
  }
  for (const entry of bookmark.booleanValues) {
    const ctx = visible(entry.propertyId);
    if (!ctx) continue;
    const item = booleanValueItem(entry, ctx.property, ctx.placement);
    if (item) items.push(item);
  }
  for (const entry of bookmark.dateTimeValues) {
    const ctx = visible(entry.propertyId);
    if (ctx) items.push(dateTimeValueItem(entry, ctx.property, ctx.placement));
  }
  for (const entry of bookmark.fileValues) {
    const ctx = visible(entry.propertyId);
    if (ctx) items.push(fileValueItem(entry, ctx.property, ctx.placement));
  }
  for (const entry of bookmark.choicesValues) {
    const ctx = visible(entry.propertyId);
    if (!ctx) continue;
    const item = choicesValueItem(entry, ctx.property, ctx.placement);
    if (item) items.push(item);
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
  hideWebsiteForYouTube = false,
): string | null {
  switch (key) {
    case "title": return bookmark.title || null;
    case "description": return bookmark.description || null;
    case "category": return categoryName;
    case "website":
      return bookmark.youtubeChannel && hideWebsiteForYouTube ? null : bookmark.website?.siteName ?? null;
    case "mediaType": return bookmark.mediaType?.name ?? null;
    case "youtubeChannel": return bookmark.youtubeChannel?.name ?? null;
    case "tags": return bookmark.tags.length > 0 ? bookmark.tags.map(tag => tag.name).join(", ") : null;
    case "locations":
      return bookmark.locations.length > 0 ? bookmark.locations.map(loc => loc.name).join(", ") : null;
    default: return null;
  }
}
