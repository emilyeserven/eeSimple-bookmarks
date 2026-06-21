import { useState } from "react";

import { Link, createFileRoute } from "@tanstack/react-router";

import { MediaTypeTreeList } from "../components/MediaTypeTreeList";
import { TabWrapper } from "../components/TabWrapper";
import { useMediaTypeTree } from "../hooks/useMediaTypes";
import { findAncestorPath, flattenTree } from "../lib/tagTree";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/_view/hierarchy")({
  component: HierarchyViewTab,
});

function HierarchyViewTab() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  const {
    data, isLoading,
  } = useMediaTypeTree();
  const tree = data ?? [];
  const node = flattenTree(tree).find(flat => flat.node.slug === mediaTypeSlug)?.node;
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(node?.children.map(c => c.id) ?? []),
  );

  function onToggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      }
      else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <TabWrapper
      entity={node}
      isLoading={isLoading}
      notFoundMessage="Media type not found."
      title="Hierarchy"
      description="Parent and child media types."
    >
      {(current) => {
        const path = findAncestorPath(tree, mediaTypeSlug);
        const ancestors = path ? path.slice(0, -1) : [];

        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Parents</p>
              {ancestors.length === 0
                ? (
                  <p className="text-sm text-muted-foreground">(root — no parent)</p>
                )
                : (
                  <ol className="flex flex-wrap items-center gap-1 text-sm">
                    {ancestors.map((ancestor, i) => (
                      <li
                        key={ancestor.id}
                        className="flex items-center gap-1"
                      >
                        {i > 0 && <span className="text-muted-foreground">→</span>}
                        <Link
                          to="/taxonomies/media-types/$mediaTypeSlug/general"
                          params={{
                            mediaTypeSlug: ancestor.slug,
                          }}
                          className="hover:underline"
                        >
                          {ancestor.name}
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Children</p>
              {current.children.length === 0
                ? (
                  <p className="text-sm text-muted-foreground">No child media types.</p>
                )
                : (
                  <MediaTypeTreeList
                    tree={current.children}
                    expanded={expanded}
                    onToggle={onToggle}
                    columns={1}
                  />
                )}
            </div>
          </div>
        );
      }}
    </TabWrapper>
  );
}
