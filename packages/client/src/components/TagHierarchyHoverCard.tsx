import type { BookmarkTag } from "@eesimple/types";
import type { ReactNode } from "react";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";

import { EntityHierarchyHoverCard } from "./EntityHierarchyHoverCard";
import { useTagTree } from "../hooks/useTags";
import { findAncestorPath } from "../lib/tagTree";

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

  return (
    <EntityHierarchyHoverCard
      path={path}
      renderLink={node => (
        <Link
          to="/tags/$tagSlug/info"
          params={{
            tagSlug: node.slug,
          }}
        >
          {node.name}
        </Link>
      )}
    >
      {children}
    </EntityHierarchyHoverCard>
  );
}
