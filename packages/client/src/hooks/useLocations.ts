import type {
  CreateLocationChainInput,
  CreateLocationInput,
  SetLocationAncestorsInput,
  UpdateLocationInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { locationsApi } from "../lib/api/taxonomies";
import { notifySuccess } from "../lib/notifications";
import { flattenTree } from "../lib/tagTree";

const LOCATIONS_KEY = ["locations"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

/**
 * Fire a toast (also recorded in the Notifications log) naming which geocoder an outbound request is
 * going to, whenever a geocoding mutation's `onMutate` fires — the free-text lookup, the on-demand
 * boundary backfill, and the coordinate repull all call this, so the user always sees when a place
 * query leaves the box and which source it's headed to (the same privacy-transparency ethos as the
 * rest of the pipeline). `source: "wikidata"` covers both the explicit "Search Wikidata instead"
 * lookup action and a location whose `usesWikidataCoordinates` flag pins it to Wikidata only; anything
 * else uses the default Nominatim-first auto path (which itself falls back to Wikidata server-side
 * when Nominatim has no hit).
 */
function notifyGeocodeCall(source?: "wikidata"): void {
  notifySuccess(source === "wikidata"
    ? "Querying Wikidata…"
    : "Querying OpenStreetMap Nominatim…");
}

export function useLocations() {
  return useQuery({
    queryKey: LOCATIONS_KEY,
    queryFn: locationsApi.list,
  });
}

/** The location taxonomy as a nested tree (roots first). */
export function useLocationTree() {
  return useQuery({
    queryKey: [...LOCATIONS_KEY, "tree"],
    queryFn: locationsApi.tree,
  });
}

/**
 * A single location (as a tree node, so children and bookmark count are available) looked up by slug
 * from the location tree, plus the tree's load state. Mirrors `useTagBySlug`.
 */
export function useLocationBySlug(slug: string) {
  const query = useLocationTree();
  const location = query.data
    ? flattenTree(query.data).find(item => item.node.slug === slug)?.node
    : undefined;
  return {
    ...query,
    location,
  };
}

/** A single location (as a tree node) looked up by id from the location tree. */
export function useLocationById(id: string) {
  const query = useLocationTree();
  const location = query.data
    ? flattenTree(query.data).find(item => item.node.id === id)?.node
    : undefined;
  return {
    ...query,
    location,
  };
}

/** Invalidate locations (tree + list) and bookmarks, since location edits ripple into both. */
function useLocationInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: LOCATIONS_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  };
}

export function useCreateLocation() {
  const invalidate = useLocationInvalidation();
  return useMutation({
    mutationFn: (input: CreateLocationInput) => locationsApi.create(input),
    onSuccess: invalidate,
  });
}

/** Create a leaf location plus its ancestor chain (immediate-parent-first up to root). */
export function useCreateLocationChain() {
  const invalidate = useLocationInvalidation();
  return useMutation({
    mutationFn: (input: CreateLocationChainInput) => locationsApi.createChain(input),
    onSuccess: invalidate,
  });
}

/**
 * Build/reuse an ancestor chain above an **existing** location and reparent it under the nearest
 * resolved ancestor. Lets the edit page add higher-level ancestors (or reparent under an existing
 * one) without recreating the location. Invalidates the location + bookmark queries on success.
 */
export function useSetLocationAncestors() {
  const invalidate = useLocationInvalidation();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: SetLocationAncestorsInput; }) => locationsApi.setAncestors(id, input),
    onSuccess: invalidate,
  });
}

export function useUpdateLocation() {
  const invalidate = useLocationInvalidation();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateLocationInput; }) => locationsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteLocation() {
  const invalidate = useLocationInvalidation();
  return useMutation({
    mutationFn: (id: string) => locationsApi.remove(id),
    onSuccess: () => {
      invalidate();
      notifySuccess("Location deleted");
    },
  });
}

export function useBulkDeleteLocations() {
  return useBulkDeleteEntity(locationsApi.bulkDelete, useLocationInvalidation());
}

/**
 * Backfill a location's map boundary on demand (one geocoder request, cached server-side). Used by
 * the detail-page map when a location has no stored area yet; invalidates the location queries so the
 * polygon appears once resolved. A no-op server-side when a boundary already exists. Callers pass the
 * location's `usesWikidataCoordinates` flag so the toast names the geocoder it's actually about to hit
 * (Wikidata-only when set, else the Nominatim-first auto path).
 */
export function useRefreshLocationBoundary() {
  const invalidate = useLocationInvalidation();
  return useMutation({
    mutationFn: ({
      id,
    }: { id: string;
      usesWikidataCoordinates?: boolean; }) => locationsApi.refreshBoundary(id),
    onMutate: ({
      usesWikidataCoordinates,
    }: { id: string;
      usesWikidataCoordinates?: boolean; }) => notifyGeocodeCall(usesWikidataCoordinates ? "wikidata" : undefined),
    onSuccess: invalidate,
  });
}

/**
 * Force-refresh a location's coordinates (lat/lon, mapUrl, boundary), even when values are already
 * stored. Used by the "Re-geocode" button on the location edit/general page. Callers pass the
 * location's `usesWikidataCoordinates` flag so the toast names the geocoder it's actually about to hit.
 */
export function useRefreshLocationCoordinates() {
  const invalidate = useLocationInvalidation();
  return useMutation({
    mutationFn: ({
      id,
    }: { id: string;
      usesWikidataCoordinates?: boolean; }) => locationsApi.refreshCoordinates(id),
    onMutate: ({
      usesWikidataCoordinates,
    }: { id: string;
      usesWikidataCoordinates?: boolean; }) => notifyGeocodeCall(usesWikidataCoordinates ? "wikidata" : undefined),
    onSuccess: invalidate,
  });
}

/**
 * Geocoding lookup mutation: resolves a free-text place query to candidate locations
 * (name / coordinates / map URL / country / place type) via `/api/locations/lookup`. Used by the
 * "Look up location" search box to prefill fields. The default `source` runs the Nominatim-first
 * auto path; passing `"wikidata"` forces the Wikidata fallback directly, surfaced as the box's
 * "Search Wikidata instead" dropdown action.
 */
export function useLocationLookup() {
  return useMutation({
    mutationFn: ({
      query, source,
    }: { query: string;
      source?: "wikidata"; }) => locationsApi.lookup(query, source),
    onMutate: ({
      source,
    }: { query: string;
      source?: "wikidata"; }) => notifyGeocodeCall(source),
  });
}
