import type {
  CreateLocationChainInput,
  CreateLocationInput,
  UpdateLocationInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { locationsApi } from "../lib/api/taxonomies";
import { notifySuccess } from "../lib/notifications";
import { flattenTree } from "../lib/tagTree";

const LOCATIONS_KEY = ["locations"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

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
 * Geocoding lookup mutation: resolves a free-text place query to candidate locations
 * (name / coordinates / map URL / country / place type) via `/api/locations/lookup`. Used by the
 * create form's "Look up location" search box to prefill fields.
 */
export function useLocationLookup() {
  return useMutation({
    mutationFn: (query: string) => locationsApi.lookup(query),
  });
}
