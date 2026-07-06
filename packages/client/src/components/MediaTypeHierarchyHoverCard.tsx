import type { BookmarkMediaType } from "@eesimple/types";
import type { ReactNode } from "react";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";

import { EntityHierarchyHoverCard } from "./EntityHierarchyHoverCard";
import { useMediaTypeTree } from "../hooks/useMediaTypes";
import { useBuiltInName } from "../lib/builtInName";
import { findAncestorPath } from "../lib/tagTree";

interface MediaTypeHierarchyHoverCardProps {
  mediaType: BookmarkMediaType;
  children: ReactNode;
}

/**
 * Wraps a media-type pill so hovering it shows the media type's ancestor chain (e.g.
 * "Root → Parent → MediaTypeName") in a popover. Renders `children` unwrapped when the media-type
 * tree hasn't loaded yet or the media type has no ancestors — a top-level media type has nothing to
 * show.
 */
export function MediaTypeHierarchyHoverCard({
  mediaType, children,
}: MediaTypeHierarchyHoverCardProps) {
  const {
    data: tree,
  } = useMediaTypeTree();
  const builtInName = useBuiltInName();
  const path = useMemo(
    () => (tree ? findAncestorPath(tree, mediaType.slug) : null),
    [tree, mediaType.slug],
  );

  return (
    <EntityHierarchyHoverCard
      path={path}
      renderLink={node => (
        <Link
          to="/taxonomies/media-types/$mediaTypeSlug/info"
          params={{
            mediaTypeSlug: node.slug,
          }}
        >
          {builtInName(node)}
        </Link>
      )}
    >
      {children}
    </EntityHierarchyHoverCard>
  );
}
