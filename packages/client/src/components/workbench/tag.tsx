/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { TagNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { EntityAutofillSources } from "../EntityAutofillSources";
import { HierarchyView } from "../HierarchyView";
import { TagCategories } from "../TagCategories";
import { TagGeneralForm } from "../TagGeneralForm";
import { TagTreeList } from "../TagTreeList";

import { Button } from "@/components/ui/button";
import { useExpandedSet } from "@/hooks/useExpandedSet";
import { useNewAutofillRule } from "@/hooks/useNewAutofillRule";
import { useDeleteTag, useTagBySlug, useTagTree } from "@/hooks/useTags";
import { findAncestorPath, flattenTree, subtreeIds } from "@/lib/tagTree";

function TagGeneralView({
  entity: node,
}: {
  entity: TagNode;
}) {
  const {
    data,
  } = useTagTree();
  const newRule = useNewAutofillRule();
  const parent = node.parentId
    ? flattenTree(data ?? []).find(item => item.node.id === node.parentId)?.node
    : null;
  return (
    <>
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Parent</dt>
        <dd>{parent ? parent.name : "(root)"}</dd>
        <dt className="text-muted-foreground">Children</dt>
        <dd>{node.children.length}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{node.slug}</dd>
        <dt className="text-muted-foreground">Bookmarks</dt>
        <dd>{node.bookmarkCount ?? 0}</dd>
        {node.children.length > 0 && (node.ownBookmarkCount ?? 0) > 0
          ? (
            <>
              <dt className="text-muted-foreground/70 italic">No Child</dt>
              <dd className="text-muted-foreground/70 italic">{node.ownBookmarkCount}</dd>
            </>
          )
          : null}
        <dt className="text-muted-foreground">Created</dt>
        <dd>{new Date(node.createdAt).toLocaleDateString()}</dd>
      </dl>
      <div className="pt-2">
        <p className="mb-2 text-sm font-medium">Autofill</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={newRule.onClick}
        >
          New Autofill Rule
        </Button>
        {newRule.modal}
      </div>
      <EntityAutofillSources
        match={{
          kind: "tag",
          tagId: node.id,
        }}
      />
    </>
  );
}

function TagGeneralEdit({
  entity: node,
}: {
  entity: TagNode;
}) {
  const {
    data,
  } = useTagTree();
  return (
    <TagGeneralForm
      node={node}
      allTags={data ?? []}
      forbiddenIds={new Set(subtreeIds(node))}
    />
  );
}

function TagHierarchyView({
  entity: node,
}: {
  entity: TagNode;
}) {
  const {
    data,
  } = useTagTree();
  const {
    expanded, onToggle,
  } = useExpandedSet(node.children.map(c => c.id));
  const path = findAncestorPath(data ?? [], node.slug);
  const ancestors = path ? path.slice(0, -1) : [];
  return (
    <HierarchyView
      ancestors={ancestors}
      renderAncestorLink={ancestor => (
        <Link
          to="/tags/$tagSlug/general"
          params={{
            tagSlug: ancestor.slug,
          }}
          className="hover:underline"
        >
          {ancestor.name}
        </Link>
      )}
      hasChildren={node.children.length > 0}
      childrenEmptyLabel="No child tags."
      childrenList={(
        <TagTreeList
          tree={node.children}
          expanded={expanded}
          onToggle={onToggle}
          columns={1}
        />
      )}
    />
  );
}

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
