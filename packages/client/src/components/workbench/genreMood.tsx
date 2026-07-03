import type { EntityWorkbench } from "./types";
import type { GenreMoodNode } from "@eesimple/types";

import { GenreMoodGeneralEdit, GenreMoodGeneralView, GenreMoodHierarchyView } from "./genreMoodViews";

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
  notFound: "Entry not found.",
  navAriaLabel: "Genres & Moods sections",
  getSlug: node => node.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Name, parent, and details.",
        render: GenreMoodGeneralView,
      },
      edit: {
        title: "General",
        description: "Name, parent, and related entries.",
        render: GenreMoodGeneralEdit,
      },
    },
    {
      key: "hierarchy",
      label: "Hierarchy",
      view: {
        title: "Hierarchy",
        description: "Parent and child entries.",
        render: GenreMoodHierarchyView,
      },
    },
  ],
};
