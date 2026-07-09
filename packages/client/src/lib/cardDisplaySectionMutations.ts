import type {
  CardDisplaySection,
  CardFieldPlacement,
  CardImageCorner,
  CardImageCorners,
  CardSectionForm,
  CardZoneLayout,
  ConditionTree,
} from "@eesimple/types";

import { carryOverPlacement } from "../components/cardFieldPlacementMove";
import { makeContainerKey } from "../components/entityLayoutMutations";

/** The mutable shape the card-display section board edits: the body sections + the four image corners. */
export interface CardDisplayFields {
  sections: CardDisplaySection[];
  imageCorners: CardImageCorners;
}

/** The four image corners, in DOM order. */
export const CARD_IMAGE_CORNER_KEYS: CardImageCorner[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

/** Where a field can be dropped: into a body section, an image corner, or the (hidden) tray. */
export type FieldTarget
  = | { type: "section";
    key: string; }
    | { type: "corner";
      corner: CardImageCorner; }
      | { type: "tray" };

/** Every field key currently placed in a section or corner. */
export function placedFieldKeys(value: CardDisplayFields): Set<string> {
  const keys = new Set<string>();
  for (const section of value.sections) for (const field of section.fields) keys.add(field.key);
  for (const corner of CARD_IMAGE_CORNER_KEYS) for (const field of value.imageCorners[corner]) keys.add(field.key);
  return keys;
}

/** The existing placement for a field, wherever it sits (or undefined when unplaced). */
function findPlacement(value: CardDisplayFields, fieldKey: string): CardFieldPlacement | undefined {
  for (const section of value.sections) {
    const found = section.fields.find(f => f.key === fieldKey);
    if (found) return found;
  }
  for (const corner of CARD_IMAGE_CORNER_KEYS) {
    const found = value.imageCorners[corner].find(f => f.key === fieldKey);
    if (found) return found;
  }
  return undefined;
}

/** A copy of `value` with `fieldKey` stripped from every section and corner. */
function withoutField(value: CardDisplayFields, fieldKey: string): CardDisplayFields {
  return {
    sections: value.sections.map(section => ({
      ...section,
      fields: section.fields.filter(f => f.key !== fieldKey),
    })),
    imageCorners: Object.fromEntries(
      CARD_IMAGE_CORNER_KEYS.map(corner => [corner, value.imageCorners[corner].filter(f => f.key !== fieldKey)]),
    ) as CardImageCorners,
  };
}

/**
 * Move a field to a target (section / corner / tray), carrying over its per-field knobs. Removing to
 * the tray simply drops it from every section/corner. `index` positions it within a target section
 * (default: appended). Pure.
 */
export function moveField(
  value: CardDisplayFields,
  fieldKey: string,
  target: FieldTarget,
  index?: number,
): CardDisplayFields {
  const existing = findPlacement(value, fieldKey);
  const stripped = withoutField(value, fieldKey);
  if (target.type === "tray") return stripped;
  if (target.type === "corner") {
    const placement = carryOverPlacement(fieldKey, existing, true);
    return {
      ...stripped,
      imageCorners: {
        ...stripped.imageCorners,
        [target.corner]: [...stripped.imageCorners[target.corner], placement],
      },
    };
  }
  const placement = carryOverPlacement(fieldKey, existing, false);
  return {
    ...stripped,
    sections: stripped.sections.map((section) => {
      if (section.key !== target.key) return section;
      const fields = [...section.fields];
      const at = index === undefined ? fields.length : Math.max(0, Math.min(index, fields.length));
      fields.splice(at, 0, placement);
      return {
        ...section,
        fields,
      };
    }),
  };
}

/** Update one field's per-field knobs wherever it is placed. Pure. */
export function patchFieldPlacement(
  value: CardDisplayFields,
  fieldKey: string,
  patch: Partial<CardFieldPlacement>,
): CardDisplayFields {
  const apply = (fields: CardFieldPlacement[]) =>
    fields.map(f => (f.key === fieldKey
      ? {
        ...f,
        ...patch,
      }
      : f));
  return {
    sections: value.sections.map(section => ({
      ...section,
      fields: apply(section.fields),
    })),
    imageCorners: Object.fromEntries(
      CARD_IMAGE_CORNER_KEYS.map(corner => [corner, apply(value.imageCorners[corner])]),
    ) as CardImageCorners,
  };
}

/** Append a new empty body section (stacked / flex) with a stable key. Pure. */
export function addSection(sections: CardDisplaySection[], title = "New section"): CardDisplaySection[] {
  const key = makeContainerKey(title, new Set(sections.map(s => s.key)), "section");
  return [
    ...sections,
    {
      key,
      title,
      form: "stacked",
      layout: {
        mode: "flex",
      },
      fields: [],
    },
  ];
}

/** Rename a section (its user-facing title). Pure. */
export function renameSection(sections: CardDisplaySection[], key: string, title: string): CardDisplaySection[] {
  return sections.map(section => (section.key === key
    ? {
      ...section,
      title,
    }
    : section));
}

/** Set a section's render form (stacked / inline / table). Pure. */
export function setSectionForm(sections: CardDisplaySection[], key: string, form: CardSectionForm): CardDisplaySection[] {
  return sections.map(section => (section.key === key
    ? {
      ...section,
      form,
    }
    : section));
}

/** Replace a section's layout (mode + gap/align/direction/wrap). Pure. */
export function setSectionLayout(sections: CardDisplaySection[], key: string, layout: CardZoneLayout): CardDisplaySection[] {
  return sections.map(section => (section.key === key
    ? {
      ...section,
      layout,
    }
    : section));
}

/** Set (or clear) a section's `visibleIf` condition. An empty tree clears it (always visible). Pure. */
export function setSectionVisibility(
  sections: CardDisplaySection[],
  key: string,
  tree: ConditionTree,
): CardDisplaySection[] {
  const visibleIf = tree.children.length > 0 ? tree : undefined;
  return sections.map((section) => {
    if (section.key !== key) return section;
    const next = {
      ...section,
    };
    if (visibleIf) next.visibleIf = visibleIf;
    else delete next.visibleIf;
    return next;
  });
}

/** Move a section up (`dir = -1`) or down (`dir = 1`) in render order. Pure. */
export function moveSection(sections: CardDisplaySection[], key: string, dir: -1 | 1): CardDisplaySection[] {
  const index = sections.findIndex(section => section.key === key);
  const target = index + dir;
  if (index < 0 || target < 0 || target >= sections.length) return sections;
  const next = [...sections];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Remove a section; its fields return to the tray (they are simply dropped from the section). Pure. */
export function removeSection(sections: CardDisplaySection[], key: string): CardDisplaySection[] {
  return sections.filter(section => section.key !== key);
}
