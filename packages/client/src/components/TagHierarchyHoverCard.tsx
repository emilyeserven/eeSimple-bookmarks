import type { BookmarkTag } from "@eesimple/types";
import type { ReactNode } from "react";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";

import { useTagTree } from "../hooks/useTags";
import { findAncestorPath } from "../lib/tagTree";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface TagHierarchyHoverCardProps {
  tag: BookmarkTag;
  children: ReactNode;
}

/**
 * Wraps a tag pill/link so hovering it shows the tag's ancestor chain (e.g.
 * "Root → Parent → TagName") in a popover. Renders `children` unwrapped when the tag tree hasn't
 * loaded yet or the tag has no ancestors — a top-level tag has nothing to show.
 */
export function TagHierarchyHoverCard({
  tag, children,
}: TagHierarchyHoverCardProps) {
  const {
    data: tree,
  } = useTagTree();
  const path = useMemo(() => (tree ? findAncestorPath(tree, tag.slug) : null), [tree, tag.slug]);

  if (!path || path.length <= 1) return children;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-auto max-w-xs p-2 text-sm">
        <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
          {path.map((node, index) => (
            <li
              key={node.id}
              className="flex items-center gap-1"
            >
              {index > 0
                ? <span aria-hidden="true">→</span>
                : null}
              {index === path.length - 1
                ? <span className="font-medium text-foreground">{node.name}</span>
                : (
                  <Link
                    to="/tags/$tagSlug/general"
                    params={{
                      tagSlug: node.slug,
                    }}
                  >
                    {node.name}
                  </Link>
                )}
            </li>
          ))}
        </ol>
      </HoverCardContent>
    </HoverCard>
  );
}
