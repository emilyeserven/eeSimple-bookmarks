import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, GenreMoodNode } from "@eesimple/types";

import i18n from "../../i18n";
import { EntityNamesTabView, PrimaryLanguageTabView } from "../entityNames/EntityNamesTab";
import { GenreMoodAssignmentSection } from "../GenreMoodAssignmentSection";
import {
  GenreMoodDescriptionField,
  GenreMoodNameField,
  GenreMoodNamesEdit,
  GenreMoodParentField,
  GenreMoodPrimaryLanguageEdit,
} from "../GenreMoodGeneralForm";
import { GenreMoodHierarchyView, GenreMoodStatsView } from "./genreMoodViews";

import { useDeleteGenreMood, useGenreMoodBySlug, useGenreMoodTree } from "@/hooks/useGenreMoods";
import { flattenTree } from "@/lib/tagTree";

/**
 * The Genres & Moods workbench's field registry (#1106 layout editor, extraction #1190). The former
 * single composite `general` field (Name/Description/Parent + Primary language + Names + the
 * cross-taxonomy assignment picker, all bundled into one `useAppForm`) is split into independently
 * placeable fields, mirroring the Category precedent (`primaryLanguage`/`names`/`genreMoods` promoted
 * beside its `details` composite):
 * - `name`/`description`/`parent` are **edit-only** — each its own small `useAppForm` instance, since
 *   (unlike Category's name/icon/description) they share no CSS grid and have no real cross-field
 *   coordination worth a shared form-context provider.
 * - `stats` is **view-only** — the read-only Parent/Children/Slug/Description/Bookmarks/Created grid
 *   stays one composite field (splitting a display-only grid would only fragment it).
 * - `primaryLanguage`/`names` carry **both** modes, promoted exactly like Category's.
 * - `relatedGenreMoods` is **edit-only**, mirroring Category's edit-only `genreMoods` field.
 * - `hierarchy` stays **view-only** — that is how the old view-only "Hierarchy" tab reproduces with no
 *   special-casing.
 * Authored as an exhaustive `Record<GenreMoodFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type GenreMoodFieldKey
  = | "name"
    | "description"
    | "stats"
    | "primaryLanguage"
    | "names"
    | "parent"
    | "relatedGenreMoods"
    | "hierarchy";

const genreMoodFields = {
  name: {
    key: "name",
    label: i18n.t("Name"),
    edit: ({
      entity,
    }) => <GenreMoodNameField node={entity} />,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    edit: ({
      entity,
    }) => <GenreMoodDescriptionField node={entity} />,
  },
  stats: {
    key: "stats",
    label: i18n.t("General"),
    view: GenreMoodStatsView,
  },
  primaryLanguage: {
    key: "primaryLanguage",
    label: i18n.t("Primary language"),
    view: ({
      entity,
    }) => (
      <PrimaryLanguageTabView
        ownerType="genreMood"
        ownerId={entity.id}
      />
    ),
    edit: ({
      entity,
    }) => <GenreMoodPrimaryLanguageEdit node={entity} />,
  },
  names: {
    key: "names",
    label: i18n.t("Names"),
    view: ({
      entity,
    }) => (
      <EntityNamesTabView
        ownerType="genreMood"
        ownerId={entity.id}
      />
    ),
    edit: ({
      entity,
    }) => <GenreMoodNamesEdit node={entity} />,
  },
  parent: {
    key: "parent",
    label: i18n.t("Parent"),
    edit: ({
      entity,
    }) => <GenreMoodParentField node={entity} />,
  },
  relatedGenreMoods: {
    key: "relatedGenreMoods",
    label: i18n.t("Related Genres & Moods"),
    edit: ({
      entity,
    }) => (
      <GenreMoodAssignmentSection
        ownerType="genreMood"
        ownerId={entity.id}
        excludeId={entity.id}
        title={i18n.t("Related Genres & Moods")}
        description={i18n.t("Other Genres & Moods entries associated with this one.")}
      />
    ),
  },
  hierarchy: {
    key: "hierarchy",
    label: i18n.t("Hierarchy"),
    view: GenreMoodHierarchyView,
  },
} satisfies Record<GenreMoodFieldKey, WorkbenchField<GenreMoodNode>>;

/**
 * The code default layout: a single field order that resolves correctly in both modes. Filtered to
 * edit-only + both-mode fields: `name, description, primaryLanguage, names, parent,
 * relatedGenreMoods` — the pre-extraction edit order. Filtered to view-only + both-mode fields:
 * `stats, primaryLanguage, names` — the pre-extraction view order. `hierarchy` tab unchanged.
 */
const GENRE_MOOD_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: [
          "name",
          "description",
          "stats",
          "primaryLanguage",
          "names",
          "parent",
          "relatedGenreMoods",
        ] satisfies GenreMoodFieldKey[],
      }],
    },
    {
      key: "hierarchy",
      label: i18n.t("Hierarchy"),
      sections: [{
        key: "hierarchy",
        fields: ["hierarchy"] satisfies GenreMoodFieldKey[],
      }],
    },
  ],
};

/** Single source of truth for a Genres & Moods entry's tabbed view/edit UI (routes + right panel). */
export const genreMoodWorkbench: EntityWorkbench<GenreMoodNode> = {
  useBySlug: (slug) => {
    const {
      genreMood, isLoading,
    } = useGenreMoodBySlug(slug);
    return {
      entity: genreMood,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useGenreMoodTree();
    return {
      entity: flattenTree(data ?? []).find(item => item.node.id === id)?.node,
      isLoading,
      error,
    };
  },
  name: node => node.name,
  useDelete: () => {
    const mutation = useDeleteGenreMood();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Entry not found."),
  navAriaLabel: i18n.t("Genres & Moods sections"),
  listingPath: "/taxonomies/genres-moods",
  getSlug: node => node.slug,
  layoutKind: "genre-mood",
  fields: genreMoodFields,
  defaultLayout: GENRE_MOOD_DEFAULT_LAYOUT,
  // Layout-driven: the body comes from `fields` + `defaultLayout`. `tabs` is a thin placeholder
  // retained only for the descriptor's type requirement (no `group` nav metadata needed here).
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
    {
      key: "hierarchy",
      label: i18n.t("Hierarchy"),
    },
  ],
};
