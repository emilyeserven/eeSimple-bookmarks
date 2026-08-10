import type { EvaluateOptions } from "@eesimple/types";

import { useMemo } from "react";

import {
  buildLocationDescendants,
  buildMediaTypeDescendants,
  buildTagDescendants,
  buildTaxonomyTermDescendants,
} from "@eesimple/types";

import { useLocations } from "./useLocations";
import { useMediaTypes } from "./useMediaTypes";
import { useTags } from "./useTags";
import { useAllTaxonomyTerms } from "./useTaxonomies";

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
 * cascade resolvers (Tags, Locations, Media Types, and taxonomy terms), built once from the
 * already-cached flat taxonomy lists. Every client surface that evaluates a condition tree against a
 * bookmark (card display rules, section visibility, the add-form effective config) routes through
 * this so all of them honor the per-item cascade toggle identically — and consistently with the
 * server's `BookmarkEvaluationData`. Mirrors `useResolveCardDisplay`'s memoize-descendants-once shape.
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
    data: taxonomyTerms = [],
  } = useAllTaxonomyTerms();

  return useMemo<EvaluateOptions>(() => ({
    tagDescendants: buildTagDescendants(idParent(tags)),
    locationDescendants: buildLocationDescendants(idParent(locations)),
    mediaTypeDescendants: buildMediaTypeDescendants(idParent(mediaTypes)),
    // Spans EVERY taxonomy, not just Genres & Moods: term ids are globally unique, so one descendant
    // map serves both the `taxonomy` leaf (any user taxonomy) and the legacy `genre-mood` leaf, whose
    // entries live in the same `taxonomy_terms` table. Matches how the server's `bookmarkCache`
    // builds it from all rows — sourcing it from G&M alone silently no-op'd cascade for every other
    // taxonomy's terms.
    taxonomyTermDescendants: buildTaxonomyTermDescendants(idParent(taxonomyTerms)),
  }), [tags, locations, mediaTypes, taxonomyTerms]);
}
