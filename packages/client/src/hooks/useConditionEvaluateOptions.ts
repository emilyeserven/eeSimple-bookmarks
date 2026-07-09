import type { EvaluateOptions } from "@eesimple/types";

import { useMemo } from "react";

import {
  buildLocationDescendants,
  buildMediaTypeDescendants,
  buildTagDescendants,
  buildTaxonomyTermDescendants,
} from "@eesimple/types";

import { useGenreMoods } from "./useGenreMoods";
import { useLocations } from "./useLocations";
import { useMediaTypes } from "./useMediaTypes";
import { useTags } from "./useTags";

/** Map a flat `{ id, parentId }`-carrying list to the shape `build*Descendants` expects. */
function idParent(rows: readonly { id: string;
  parentId: string | null; }[]): { id: string;
  parentId: string | null; }[] {
  return rows.map(row => ({
    id: row.id,
    parentId: row.parentId,
  }));
}

/**
 * The shared client-side {@link EvaluateOptions} for `evaluateConditions` — the four hierarchical
 * cascade resolvers (Tags, Locations, Media Types, Genres & Moods), built once from the already-cached
 * flat taxonomy lists. Every client surface that evaluates a condition tree against a bookmark
 * (card display rules, section visibility, the add-form effective config) routes through this so all
 * of them honor the per-item cascade toggle identically — and consistently with the server's
 * `BookmarkEvaluationData`. Mirrors `useResolveCardDisplay`'s memoize-descendants-once shape.
 */
export function useConditionEvaluateOptions(): EvaluateOptions {
  const {
    data: tags = [],
  } = useTags();
  const {
    data: locations = [],
  } = useLocations();
  const {
    data: mediaTypes = [],
  } = useMediaTypes();
  const {
    data: genreMoods = [],
  } = useGenreMoods();

  return useMemo<EvaluateOptions>(() => ({
    tagDescendants: buildTagDescendants(idParent(tags)),
    locationDescendants: buildLocationDescendants(idParent(locations)),
    mediaTypeDescendants: buildMediaTypeDescendants(idParent(mediaTypes)),
    // Genres & Moods is part of the taxonomy engine now; its tree backs both the taxonomy leaf and
    // the legacy genre-mood leaf cascade toggle.
    taxonomyTermDescendants: buildTaxonomyTermDescendants(idParent(genreMoods)),
  }), [tags, locations, mediaTypes, genreMoods]);
}
