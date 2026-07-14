import type { LayoutFieldMeta } from "../components/LayoutBoard";
import type { EntityWorkbench, WorkbenchField } from "../components/workbench/types";
import type { LayoutableEntityKind } from "@eesimple/types";

import { bookmarkWorkbench } from "../components/workbench/bookmark";
import { buildTaxonomyTermWorkbench } from "../components/workbench/taxonomyTerm";
import { ENTITY_DESCRIPTORS } from "../entities/registry";
import i18n from "../i18n";
import { makeTaxonomy } from "../test-utils/factories";

/**
 * The static, taxonomy-agnostic base workbench for the generic `"taxonomy-term"` layout kind. Unlike the
 * other kinds, taxonomy-term has no `ENTITY_DESCRIPTORS` entry — its real workbench is built per-taxonomy
 * by {@link buildTaxonomyTermWorkbench}. For the Page Layouts editor (which edits the shared
 * `"taxonomy-term"` layout every non-custom taxonomy renders through) we build one representative
 * workbench from a synthetic **hierarchical** taxonomy (so every field — incl. `parent`/`hierarchy` —
 * surfaces) whose `customLayout: false` makes `taxonomyTermLayoutKind` resolve to the literal
 * `"taxonomy-term"`. Constructing the workbench calls no hooks (its `use*` members are closures), so
 * module-load construction is safe.
 */
const taxonomyTermBaseWorkbench = buildTaxonomyTermWorkbench(
  makeTaxonomy({
    id: "__taxonomy_term_layout__",
    name: i18n.t("Taxonomy term"),
    slug: "taxonomy-terms",
    hierarchical: true,
    customLayout: false,
  }),
) as unknown as EntityWorkbench<{ id: string }>;

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
  // taxonomy-term has no `ENTITY_DESCRIPTORS` entry (its real workbench is per-taxonomy); the picker
  // edits the shared `"taxonomy-term"` layout through this representative base workbench.
  if (kind === "taxonomy-term") return taxonomyTermBaseWorkbench;
  const descriptors = ENTITY_DESCRIPTORS as unknown as Record<string, { workbench: EntityWorkbench<{ id: string }> }>;
  return descriptors[kind].workbench;
}

/**
 * Every layoutable entity kind, selectable on the Page Layouts settings page (#1162). As of #1371 this
 * lists all of `LAYOUTABLE_ENTITY_KINDS` — each entity's workbench carries `layoutKind`/`fields`/
 * `defaultLayout` with its General composite atomized into granular, independently-placeable fields (see
 * CLAUDE.md "Entity page layouts"). Adding a new layoutable kind means adding one entry here (and, if it
 * has no `ENTITY_DESCRIPTORS` entry like `taxonomy-term`, a `baseWorkbenchForKind` special case).
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
  {
    kind: "language",
    label: i18n.t("Language"),
  },
  {
    kind: "place-type",
    label: i18n.t("Place Type"),
  },
  {
    kind: "location-relation",
    label: i18n.t("Location Relation"),
  },
  {
    kind: "group-type",
    label: i18n.t("Group Type"),
  },
  {
    kind: "relationship-type",
    label: i18n.t("Relationship Type"),
  },
  {
    kind: "import-rule",
    label: i18n.t("Import Rule"),
  },
  {
    kind: "saved-filter",
    label: i18n.t("Saved Filter"),
  },
  {
    kind: "taxonomy-term",
    label: i18n.t("Taxonomy Term"),
  },
];
