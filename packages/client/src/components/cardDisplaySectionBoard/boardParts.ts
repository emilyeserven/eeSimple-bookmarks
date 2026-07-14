import type { CardDisplayFields, CardFieldTarget } from "../../lib/cardDisplaySectionMutations";
import type { CollisionDetection } from "@dnd-kit/core";
import type { CardDisplaySection, CardImageCorner, CardSectionForm } from "@eesimple/types";

import { pointerWithin, rectIntersection } from "@dnd-kit/core";

import { CARD_IMAGE_CORNER_KEYS } from "../../lib/cardDisplaySectionMutations";

export const TRAY_ID = "card-tray";

/** Prefer the container the pointer is inside, falling back to rect intersection (see `LayoutBoard`). */
export const boardCollision: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  return pointer.length > 0 ? pointer : rectIntersection(args);
};

/** Human labels for the four image corners. */
export const CORNER_LABELS: Record<CardImageCorner, string> = {
  "top-left": "Top left",
  "top-right": "Top right",
  "bottom-left": "Bottom left",
  "bottom-right": "Bottom right",
};

/** The per-section "layout" dropdown value = a (form, grid?) pair encoded as one option. */
export const FORM_OPTIONS: { value: string;
  label: string;
  form: CardSectionForm;
  mode: "flex" | "grid"; }[] = [
  {
    value: "stacked-flex",
    label: "Stacked rows",
    form: "stacked",
    mode: "flex",
  },
  {
    value: "stacked-grid",
    label: "Stacked grid",
    form: "stacked",
    mode: "grid",
  },
  {
    value: "inline-flex",
    label: "Inline pills",
    form: "inline",
    mode: "flex",
  },
  {
    value: "inline-grid",
    label: "Two-column pills",
    form: "inline",
    mode: "grid",
  },
  {
    value: "table",
    label: "Details table",
    form: "table",
    mode: "grid",
  },
];

export function formOptionValue(section: CardDisplaySection): string {
  if (section.form === "table") return "table";
  return `${section.form}-${section.layout.mode}`;
}

export interface MoveTargetList {
  label: string;
  target: CardFieldTarget;
}

/** Locate a field's container + index (for drop-onto-chip insertion). */
export function locateField(value: CardDisplayFields, fieldKey: string): { target: CardFieldTarget;
  index: number; } | null {
  for (const section of value.sections) {
    const idx = section.fields.findIndex(f => f.key === fieldKey);
    if (idx >= 0) return {
      target: {
        type: "section",
        key: section.key,
      },
      index: idx,
    };
  }
  for (const corner of CARD_IMAGE_CORNER_KEYS) {
    const idx = value.imageCorners[corner].findIndex(f => f.key === fieldKey);
    if (idx >= 0) return {
      target: {
        type: "corner",
        corner,
      },
      index: idx,
    };
  }
  return null;
}
