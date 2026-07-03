import type { BookmarkLocation } from "@eesimple/types";
import type { ReactNode } from "react";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";

import { EntityHierarchyHoverCard } from "./EntityHierarchyHoverCard";
import { useLocationTree } from "../hooks/useLocations";
import { findAncestorPath } from "../lib/tagTree";

interface LocationHierarchyHoverCardProps {
  location: BookmarkLocation;
  children: ReactNode;
}

/**
 * Wraps a location pill/link so hovering it shows the location's ancestor chain (e.g.
 * "Root → Parent → LocationName") in a popover. Renders `children` unwrapped when the location tree
 * hasn't loaded yet or the location has no ancestors — a top-level location has nothing to show.
 */
export function LocationHierarchyHoverCard({
  location, children,
}: LocationHierarchyHoverCardProps) {
  const {
    data: tree,
  } = useLocationTree();
  const path = useMemo(
    () => (tree ? findAncestorPath(tree, location.slug) : null),
    [tree, location.slug],
  );

  return (
    <EntityHierarchyHoverCard
      path={path}
      renderLink={node => (
        <Link
          to="/taxonomies/locations/$locationSlug/general"
          params={{
            locationSlug: node.slug,
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
