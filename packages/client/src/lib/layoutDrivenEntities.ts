import type { LayoutFieldMeta } from "../components/LayoutBoard";
import type { EntityWorkbench, WorkbenchField } from "../components/workbench/types";
import type { LayoutableEntityKind } from "@eesimple/types";

import { bookmarkWorkbench } from "../components/workbench/bookmark";
import { ENTITY_DESCRIPTORS } from "../entities/registry";
import i18n from "../i18n";

/** One entity kind selectable on the Page Layouts settings page. */
export interface LayoutDrivenEntity {
  kind: LayoutableEntityKind;
  label: string;
}

/** Convert a `WorkbenchField` registry into the `LayoutBoard`'s field-metadata shape. */
export function fieldsFromRegistry<E>(fields: Record<string, WorkbenchField<E>> | undefined): LayoutFieldMeta[] {
  return Object.values(fields ?? {}).map(field => ({
    key: field.key,
    label: field.label,
    icon: field.icon,
  }));
}

/**
 * The base (pre-dynamic-merge) workbench for a kind — bookmark is off `ENTITY_DESCRIPTORS`. Feed this
 * into `useLayoutDrivenWorkbench` (never read `.fields`/`.defaultLayout` off it directly) so every
 * consumer — the Page Layouts editor, its live preview pane, and the real View/Edit pages — merges in
 * the same runtime dynamic fields (bookmark custom properties, per-taxonomy fields) and can never drift
 * out of sync with one another.
 */
export function baseWorkbenchForKind(kind: LayoutableEntityKind): EntityWorkbench<{ id: string }> {
  if (kind === "bookmark") return bookmarkWorkbench as unknown as EntityWorkbench<{ id: string }>;
  const descriptors = ENTITY_DESCRIPTORS as unknown as Record<string, { workbench: EntityWorkbench<{ id: string }> }>;
  return descriptors[kind].workbench;
}

/**
 * Entity kinds whose field registry (#1159) has landed — the Page Layouts settings page (#1162)
 * only lists these, per `LAYOUTABLE_ENTITY_KINDS`' own doc note that not every kind has a registry
 * yet. Add an entry here as each entity's workbench gains `layoutKind`/`fields`/`defaultLayout`
 * (see CLAUDE.md "Entity page layouts").
 */
export const LAYOUT_DRIVEN_ENTITIES: LayoutDrivenEntity[] = [
  {
    kind: "bookmark",
    label: i18n.t("Bookmark"),
  },
  {
    kind: "category",
    label: i18n.t("Category"),
  },
  {
    kind: "newsletter",
    label: i18n.t("Newsletter"),
  },
  {
    kind: "group",
    label: i18n.t("Group"),
  },
  {
    kind: "custom-property",
    label: i18n.t("Custom Property"),
  },
  {
    kind: "genre-mood",
    label: i18n.t("Genres & Moods"),
  },
  {
    kind: "tag",
    label: i18n.t("Tag"),
  },
  {
    kind: "website",
    label: i18n.t("Website"),
  },
  {
    kind: "media-type",
    label: i18n.t("Media Type"),
  },
  {
    kind: "location",
    label: i18n.t("Location"),
  },
  {
    kind: "youtube-channel",
    label: i18n.t("YouTube Channel"),
  },
  {
    kind: "person",
    label: i18n.t("Person"),
  },
  {
    kind: "autofill",
    label: i18n.t("Autofill Rules"),
  },
];
