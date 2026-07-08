import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, GenreMoodNode } from "@eesimple/types";

import { GenreMoodGeneralEdit, GenreMoodGeneralView, GenreMoodHierarchyView } from "./genreMoodViews";
import i18n from "../../i18n";

import { useDeleteGenreMood, useGenreMoodBySlug, useGenreMoodTree } from "@/hooks/useGenreMoods";
import { flattenTree } from "@/lib/tagTree";

/**
 * The Genres & Moods workbench's field registry (#1106 layout editor). `general` carries both
 * modes (`GenreMoodGeneralView`/`GenreMoodGeneralEdit`, each already a cohesive composite); `hierarchy`
 * is **view-only** — that is how the old view-only "Hierarchy" tab reproduces with no special-casing.
 */
type GenreMoodFieldKey = "general" | "hierarchy";

const genreMoodFields = {
  general: {
    key: "general",
    label: i18n.t("General"),
    view: GenreMoodGeneralView,
    edit: GenreMoodGeneralEdit,
  },
  hierarchy: {
    key: "hierarchy",
    label: i18n.t("Hierarchy"),
    view: GenreMoodHierarchyView,
  },
} satisfies Record<GenreMoodFieldKey, WorkbenchField<GenreMoodNode>>;

/** The code default layout: the current two tabs, one untitled section each, in current order. */
const GENRE_MOOD_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["general"] satisfies GenreMoodFieldKey[],
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
