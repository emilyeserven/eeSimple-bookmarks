import type { CollisionDetection } from "@dnd-kit/core";
import type { CardFieldPlacement, CardFieldZone } from "@eesimple/types";

import { pointerWithin, rectIntersection } from "@dnd-kit/core";

import i18n from "../../i18n";

/** The droppable id for the tray of unplaced (hidden) fields. */
export const TRAY_ID = "zone-tray";

/** Maps a hierarchical taxonomy field's key to the `CardFieldPlacement` boolean it toggles. */
export const HIERARCHY_HOVER_PROP: Partial<Record<string, keyof CardFieldPlacement>> = {
  mediaType: "showMediaTypeHierarchyOnHover",
  locations: "showLocationHierarchyOnHover",
  genreMoods: "showGenreMoodHierarchyOnHover",
};

/**
 * Prefer the zone the pointer is literally inside, falling back to rectangle intersection. `closestCorners`
 * mis-resolves an empty zone (its corners bunch at the top) so the short Table / Single-column-bottom
 * targets never won the drop; this is the dnd-kit-recommended strategy for variable-height containers.
 */
export const zoneCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
};

/** The four image-corner zones, shown as a 2×2 grid (overlays on the card image). */
export const IMAGE_ZONE_DEFS: { zone: CardFieldZone;
  label: string; }[] = [
  {
    zone: "image-top-left",
    label: i18n.t("Image top-left"),
  },
  {
    zone: "image-top-right",
    label: i18n.t("Image top-right"),
  },
  {
    zone: "image-bottom-left",
    label: i18n.t("Image bottom-left"),
  },
  {
    zone: "image-bottom-right",
    label: i18n.t("Image bottom-right"),
  },
];

/** The four card-body sub-zones, stacked full-width in the order they render on the card. */
export const BODY_ZONE_DEFS: { zone: CardFieldZone;
  label: string;
  hint: string; }[] = [
  {
    zone: "card-single-top",
    label: i18n.t("Single column top"),
    hint: i18n.t("Full-width rows above the rest of the card."),
  },
  {
    zone: "card-labels",
    label: i18n.t("Labels"),
    hint: i18n.t("Pills and badges in their existing label form."),
  },
  {
    zone: "card-table",
    label: i18n.t("Table"),
    hint: i18n.t("A label : value two-column table."),
  },
  {
    zone: "card-single-bottom",
    label: i18n.t("Single column bottom"),
    hint: i18n.t("Full-width rows below the rest of the card."),
  },
];

/** Every drop target offered by a chip's "Move to…" menu: the eight zones plus the hidden tray. */
export const MOVE_TARGETS: { zone: CardFieldZone | null;
  label: string; }[] = [
  ...BODY_ZONE_DEFS.map(def => ({
    zone: def.zone,
    label: def.label,
  })),
  ...IMAGE_ZONE_DEFS.map(def => ({
    zone: def.zone,
    label: def.label,
  })),
  {
    zone: null,
    label: i18n.t("Available (hidden)"),
  },
];

export const SCALE_OPTIONS = [
  {
    value: "0.75",
    label: "0.75×",
  },
  {
    value: "1",
    label: "1×",
  },
  {
    value: "1.5",
    label: "1.5×",
  },
  {
    value: "2",
    label: "2×",
  },
];

export const MOBILE_SCALE_OPTIONS = [
  {
    value: "inherit",
    label: i18n.t("Inherit"),
  },
  ...SCALE_OPTIONS,
];
