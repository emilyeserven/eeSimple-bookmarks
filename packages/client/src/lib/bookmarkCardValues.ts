import type { Bookmark, CardImageCorner, CustomProperty } from "@eesimple/types";

import { formatBooleanBadge, formatDateTime, formatNumber } from "./bookmarkFormat";

/**
 * A single custom-property value ready to render on a bookmark card. `kind` discriminates how it is
 * shown: a text `badge` (number/boolean/datetime) or a star `rating`. `corner` carries the
 * property's chosen image-corner placement (or `null` for the badge-below default) so the card can
 * decide between overlaying it on the image and falling back to a badge.
 */
export type BookmarkValueItem
  = | {
    kind: "badge";
    id: string;
    property: CustomProperty;
    corner: CardImageCorner | null;
    label: string;
    /** Present for boolean values, so the card can wire an inline toggle for `clickableInView`. */
    booleanValue?: boolean;
  }
  | {
    kind: "rating";
    id: string;
    property: CustomProperty;
    corner: CardImageCorner | null;
    value: number;
  };

/**
 * Build the ordered list of render-ready custom-property value items for a bookmark, honoring each
 * property's `showInListings` / `showIfFalse` and the page's `hidden` field set. The single source of
 * truth shared by the badge list (`BookmarkCardDetails`) and the image-corner overlays
 * (`BookmarkCard`) so the two never disagree about which value renders where. Rating-scale values are
 * `rating` items; number/boolean/datetime values are `badge` items.
 */
export function buildBookmarkValueItems(
  bookmark: Bookmark,
  properties: CustomProperty[],
  hidden: Set<string>,
): BookmarkValueItem[] {
  const byId = new Map(properties.map(property => [property.id, property]));
  const items: BookmarkValueItem[] = [];

  for (const entry of bookmark.numberValues) {
    const property = byId.get(entry.propertyId);
    if (!property || !property.showInListings || hidden.has(entry.propertyId)) continue;
    if (property.type === "ratingScale") {
      items.push({
        kind: "rating",
        id: entry.propertyId,
        property,
        corner: property.cardImageCorner ?? null,
        value: entry.value,
      });
    }
    else {
      items.push({
        kind: "badge",
        id: entry.propertyId,
        property,
        corner: property.cardImageCorner ?? null,
        label: `${property.name}: ${formatNumber(entry.value, property)}`,
      });
    }
  }

  for (const entry of bookmark.booleanValues) {
    const property = byId.get(entry.propertyId);
    if (!property || !property.showInListings || hidden.has(entry.propertyId)) continue;
    if (!entry.value && !property.showIfFalse) continue;
    items.push({
      kind: "badge",
      id: entry.propertyId,
      property,
      corner: property.cardImageCorner ?? null,
      label: formatBooleanBadge(entry.value, property),
      booleanValue: entry.value,
    });
  }

  for (const entry of bookmark.dateTimeValues) {
    const property = byId.get(entry.propertyId);
    if (!property || !property.showInListings || hidden.has(entry.propertyId)) continue;
    items.push({
      kind: "badge",
      id: entry.propertyId,
      property,
      corner: property.cardImageCorner ?? null,
      label: `${property.name}: ${formatDateTime(entry.value, property)}`,
    });
  }

  for (const entry of bookmark.fileValues) {
    const property = byId.get(entry.propertyId);
    if (!property || !property.showInListings || hidden.has(entry.propertyId)) continue;
    // Image/file values render as a text badge on cards (the thumbnail/download link lives in the
    // detail view). Images show just the property name; files append their original filename.
    const label = property.type === "image"
      ? property.name
      : `${property.name}: ${entry.originalFilename ?? "file"}`;
    items.push({
      kind: "badge",
      id: entry.propertyId,
      property,
      corner: property.cardImageCorner ?? null,
      label,
    });
  }

  return items;
}

/** The four image corners, in DOM order, paired with their absolute-positioning classes. */
export const CARD_IMAGE_CORNERS: { corner: CardImageCorner;
  className: string; }[] = [
  {
    corner: "top-left",
    className: "left-1 top-1 items-start",
  },
  {
    corner: "top-right",
    className: "right-1 top-1 items-end",
  },
  {
    corner: "bottom-left",
    className: "bottom-1 left-1 items-start",
  },
  {
    corner: "bottom-right",
    className: "bottom-1 right-1 items-end",
  },
];
