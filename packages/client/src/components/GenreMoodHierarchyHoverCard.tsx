import type { BookmarkGenreMood } from "@eesimple/types";
import type { ReactNode } from "react";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";

import { EntityHierarchyHoverCard } from "./EntityHierarchyHoverCard";
import { useGenreMoodTree } from "../hooks/useGenreMoods";
import { findAncestorPath } from "../lib/tagTree";

interface GenreMoodHierarchyHoverCardProps {
  genreMood: BookmarkGenreMood;
  children: ReactNode;
}

/**
 * Wraps a genre/mood badge so hovering it shows its ancestor chain (e.g.
 * "Root → Parent → GenreMoodName") in a popover. Renders `children` unwrapped when the genre/mood
 * tree hasn't loaded yet or the entry has no ancestors — a top-level entry has nothing to show.
 */
export function GenreMoodHierarchyHoverCard({
  genreMood, children,
}: GenreMoodHierarchyHoverCardProps) {
  const {
    data: tree,
  } = useGenreMoodTree();
  const path = useMemo(
    () => (tree ? findAncestorPath(tree, genreMood.slug) : null),
    [tree, genreMood.slug],
  );

  return (
    <EntityHierarchyHoverCard
      path={path}
      renderLink={node => (
        <Link
          to="/taxonomies/genres-moods/$genreMoodSlug/general"
          params={{
            genreMoodSlug: node.slug,
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
