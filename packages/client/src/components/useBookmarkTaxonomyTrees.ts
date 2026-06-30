import type { FlatNode } from "@/lib/tagTree";
import type { LocationNode, MediaTypeNode, TagNode } from "@eesimple/types";

import { useMemo } from "react";

import { useLocationTree } from "@/hooks/useLocations";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { useTagTree } from "@/hooks/useTags";
import { flattenTree } from "@/lib/tagTree";

export interface BookmarkTaxonomyTrees {
  flatMediaTypes: FlatNode<MediaTypeNode>[];
  flatTags: FlatNode<TagNode>[];
  flatLocations: FlatNode<LocationNode>[];
}

/**
 * Loads the media-type / tag / location trees and flattens each for indentation. Extracted from
 * `useBookmarkTaxonomyContext` so that hook stays under the per-file import cap; the queries and
 * their `flattenTree` memos are a cohesive cluster.
 */
export function useBookmarkTaxonomyTrees(): BookmarkTaxonomyTrees {
  const {
    data: mediaTypeTree = [],
  } = useMediaTypeTree();
  const {
    data: tagTree = [],
  } = useTagTree();
  const {
    data: locationTree = [],
  } = useLocationTree();

  const flatMediaTypes = useMemo(
    () => flattenTree(mediaTypeTree),
    [mediaTypeTree],
  );

  const flatTags = useMemo(
    () => flattenTree(tagTree),
    [tagTree],
  );

  const flatLocations = useMemo(
    () => flattenTree(locationTree),
    [locationTree],
  );

  return {
    flatMediaTypes,
    flatTags,
    flatLocations,
  };
}
