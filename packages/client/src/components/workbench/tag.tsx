import type { EntityWorkbench } from "./types";
import type { TagNode } from "@eesimple/types";

import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { TagCategories } from "../TagCategories";
import { TagGeneralEdit, TagGeneralView, TagHierarchyView } from "./tagViews";

import { useDeleteTag, useTagBySlug, useTagTree } from "@/hooks/useTags";
import { flattenTree } from "@/lib/tagTree";

/** Single source of truth for a tag's tabbed view/edit UI (main pane routes + right panel). */
export const tagWorkbench: EntityWorkbench<TagNode> = {
  useBySlug: (slug) => {
    const {
      tag, isLoading,
    } = useTagBySlug(slug);
    return {
      entity: tag,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useTagTree();
    return {
      entity: flattenTree(data ?? []).find(item => item.node.id === id)?.node,
      isLoading,
      error,
    };
  },
  name: node => node.name,
  useDelete: () => {
    const mutation = useDeleteTag();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Tag not found.",
  navAriaLabel: "Tag sections",
  listingPath: "/tags",
  getSlug: tag => tag.slug,
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Name, parent, and tag details.",
        render: TagGeneralView,
      },
      edit: {
        title: "General",
        description: "Name and parent tag.",
        render: TagGeneralEdit,
      },
    },
    {
      key: "categories",
      label: "Categories",
      view: {
        title: "Categories",
        description: "Categories that offer this tag when tagging bookmarks.",
        render: ({
          entity,
        }) => <TagCategories tag={entity} />,
      },
      edit: {
        title: "Categories",
        description: "Categories that offer this tag when tagging bookmarks.",
        render: ({
          entity,
        }) => <TagCategories tag={entity} />,
      },
    },
    {
      key: "hierarchy",
      label: "Hierarchy",
      view: {
        title: "Hierarchy",
        description: "Parent and child tags.",
        render: TagHierarchyView,
      },
    },
    {
      key: "autofill",
      label: "Autofill Rules",
      view: {
        title: "Autofill Rules",
        description: "Autofill rules that apply this tag.",
        render: ({
          entity,
        }) => (
          <AutofillRulesList
            tagId={entity.id}
            query=""
          />
        ),
      },
      edit: {
        title: "Autofill Rules",
        description: "Autofill rules that apply this tag.",
        render: ({
          entity,
        }) => (
          <AutofillRulesList
            tagId={entity.id}
            query=""
          />
        ),
      },
    },
    {
      key: "display-rules",
      label: "Display Rules",
      view: {
        title: "Display Rules",
        description: "Card display rules whose conditions reference this tag.",
        render: ({
          entity,
        }) => <CardDisplayRulesList tagId={entity.id} />,
      },
      edit: {
        title: "Display Rules",
        description: "Card display rules whose conditions reference this tag.",
        render: ({
          entity,
        }) => <CardDisplayRulesList tagId={entity.id} />,
      },
    },
  ],
};
