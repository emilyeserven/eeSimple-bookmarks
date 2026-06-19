import { useState } from "react";

import { Link, createFileRoute } from "@tanstack/react-router";

import { TabWrapper } from "../components/TabWrapper";
import { TagTreeList } from "../components/TagTreeList";
import { useTagBySlug } from "../hooks/useTags";
import { findAncestorPath } from "../lib/tagTree";

export const Route = createFileRoute("/tags/$tagSlug/_view/hierarchy")({
  component: HierarchyViewTab,
});

function HierarchyViewTab() {
  const {
    tagSlug,
  } = Route.useParams();
  const {
    tag, data, isLoading,
  } = useTagBySlug(tagSlug);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(tag?.children.map(c => c.id) ?? []),
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
      entity={tag}
      isLoading={isLoading}
      notFoundMessage="Tag not found."
      title="Hierarchy"
      description="Parent and child tags."
    >
      {(node) => {
        const path = findAncestorPath(data ?? [], tagSlug);
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
                          to="/tags/$tagSlug/general"
                          params={{
                            tagSlug: ancestor.slug,
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
              {node.children.length === 0
                ? (
                  <p className="text-sm text-muted-foreground">No child tags.</p>
                )
                : (
                  <TagTreeList
                    tree={node.children}
                    expanded={expanded}
                    onToggle={onToggle}
                  />
                )}
            </div>
          </div>
        );
      }}
    </TabWrapper>
  );
}
