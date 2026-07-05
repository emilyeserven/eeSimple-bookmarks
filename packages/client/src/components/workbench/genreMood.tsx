import type { EntityWorkbench } from "./types";
import type { GenreMoodNode } from "@eesimple/types";

import { GenreMoodGeneralEdit, GenreMoodGeneralView, GenreMoodHierarchyView } from "./genreMoodViews";
import i18n from "../../i18n";

import { useDeleteGenreMood, useGenreMoodBySlug, useGenreMoodTree } from "@/hooks/useGenreMoods";
import { flattenTree } from "@/lib/tagTree";

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
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      view: {
        title: i18n.t("General"),
        description: i18n.t("Name, parent, and details."),
        render: GenreMoodGeneralView,
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Name, parent, and related entries."),
        render: GenreMoodGeneralEdit,
      },
    },
    {
      key: "hierarchy",
      label: i18n.t("Hierarchy"),
      view: {
        title: i18n.t("Hierarchy"),
        description: i18n.t("Parent and child entries."),
        render: GenreMoodHierarchyView,
      },
    },
  ],
};
