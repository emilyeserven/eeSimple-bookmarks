/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { MediaType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { AutofillRulesList } from "../AutofillRulesList";
import { EntityAutofillSources } from "../EntityAutofillSources";
import { HierarchyView } from "../HierarchyView";
import { MediaTypeGeneralForm } from "../MediaTypeGeneralForm";
import { MediaTypeTreeList } from "../MediaTypeTreeList";

import { useExpandedSet } from "@/hooks/useExpandedSet";
import { useDeleteMediaType, useMediaTypeBySlug, useMediaTypes, useMediaTypeTree } from "@/hooks/useMediaTypes";
import { CategoryIcon } from "@/lib/icons";
import { findAncestorPath, flattenTree } from "@/lib/tagTree";

function MediaTypeGeneralView({
  entity: mt,
}: {
  entity: MediaType;
}) {
  const {
    data: allMediaTypes,
  } = useMediaTypes();
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(mt.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{mt.slug}</dd>
        {mt.parentId != null
          ? (
            <>
              <dt className="text-muted-foreground">Parent</dt>
              <dd>{(allMediaTypes ?? []).find(m => m.id === mt.parentId)?.name ?? "—"}</dd>
            </>
          )
          : null}
        <dt className="text-muted-foreground">Icon</dt>
        <dd>
          {mt.icon
            ? (
              <CategoryIcon
                name={mt.icon}
                className="size-4"
              />
            )
            : <span className="text-muted-foreground">None</span>}
        </dd>
        <dt className="text-muted-foreground">Sort order</dt>
        <dd>{mt.sortOrder}</dd>
        <dt className="text-muted-foreground">Built-in</dt>
        <dd>{mt.builtIn ? "Yes" : "No"}</dd>
        {mt.bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">Bookmarks</dt>
              <dd>{mt.bookmarkCount}</dd>
            </>
          )
          : null}
      </dl>
      <EntityAutofillSources
        match={{
          kind: "media-type",
          mediaTypeId: mt.id,
        }}
      />
    </div>
  );
}

function MediaTypeHierarchyView({
  entity: mt,
}: {
  entity: MediaType;
}) {
  const {
    data, isLoading,
  } = useMediaTypeTree();
  const tree = data ?? [];
  const node = flattenTree(tree).find(flat => flat.node.slug === mt.slug)?.node;
  const {
    expanded, onToggle,
  } = useExpandedSet(node?.children.map(c => c.id) ?? []);

  if (isLoading && !node) return <p className="text-muted-foreground">Loading…</p>;
  if (!node) return <p className="text-destructive">Media type not found.</p>;

  const path = findAncestorPath(tree, mt.slug);
  const ancestors = path ? path.slice(0, -1) : [];

  return (
    <HierarchyView
      ancestors={ancestors}
      renderAncestorLink={ancestor => (
        <Link
          to="/taxonomies/media-types/$mediaTypeSlug/general"
          params={{
            mediaTypeSlug: ancestor.slug,
          }}
          className="hover:underline"
        >
          {ancestor.name}
        </Link>
      )}
      hasChildren={node.children.length > 0}
      childrenEmptyLabel="No child media types."
      childrenList={(
        <MediaTypeTreeList
          tree={node.children}
          expanded={expanded}
          onToggle={onToggle}
          columns={1}
        />
      )}
    />
  );
}

function MediaTypeAutofillView({
  entity: mt,
}: {
  entity: MediaType;
}) {
  return (
    <div className="space-y-6">
      <EntityAutofillSources
        match={{
          kind: "media-type",
          mediaTypeId: mt.id,
        }}
      />
      <AutofillRulesList mediaTypeId={mt.id} />
    </div>
  );
}

/** Single source of truth for a media type's tabbed view/edit UI (main pane routes + right panel). */
export const mediaTypeWorkbench: EntityWorkbench<MediaType> = {
  useBySlug: (slug) => {
    const {
      mediaType, isLoading,
    } = useMediaTypeBySlug(slug);
    return {
      entity: mediaType,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useMediaTypes();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: mediaType => mediaType.name,
  isBuiltIn: mediaType => mediaType.builtIn,
  canDelete: mediaType => !mediaType.builtIn,
  useDelete: () => {
    const mutation = useDeleteMediaType();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Media type not found.",
  navAriaLabel: "Media type sections",
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Name, sort order, and metadata.",
        render: MediaTypeGeneralView,
      },
      edit: {
        title: "General",
        description: "Name and sort order.",
        render: ({
          entity,
        }) => <MediaTypeGeneralForm mediaType={entity} />,
      },
    },
    {
      key: "hierarchy",
      label: "Hierarchy",
      view: {
        title: "Hierarchy",
        description: "Parent and child media types.",
        render: MediaTypeHierarchyView,
      },
    },
    {
      key: "autofill",
      label: "Autofill Rules",
      view: {
        title: "Autofill Rules",
        description: "Autofill rules that set this media type on matching bookmarks.",
        render: MediaTypeAutofillView,
      },
      edit: {
        title: "Autofill Rules",
        description: "Autofill rules that set this media type on matching bookmarks.",
        render: MediaTypeAutofillView,
      },
    },
  ],
};
