import type { EntityNameOwnerType, UpdateEntityNameEntry } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { entityNamesApi } from "../lib/api/taxonomies";

const namesKey = (ownerType: EntityNameOwnerType, ownerId: string) =>
  ["entity-names", ownerType, ownerId] as const;

/** The list-query key each owner type's entity is cached under, so a primary-name change (which
 * renames the owner's base name/title) invalidates the right list/detail queries. Exhaustive over
 * `EntityNameOwnerType` — a new owner type fails `tsc` until listed here. */
const OWNER_QUERY_KEYS: Record<EntityNameOwnerType, string> = {
  bookmark: "bookmarks",
  category: "categories",
  tag: "tags",
  mediaType: "media-types",
  genreMood: "genre-moods",
  taxonomyTerm: "taxonomies",
  location: "locations",
  person: "people",
  group: "groups",
};

/** An owner's multilingual names. */
export function useEntityNames(ownerType: EntityNameOwnerType, ownerId: string) {
  return useQuery({
    queryKey: namesKey(ownerType, ownerId),
    queryFn: () => entityNamesApi.get(ownerType, ownerId),
    enabled: ownerId.length > 0,
  });
}

/**
 * Set names for an owner whose id isn't known until after this call — e.g. a follow-up write right
 * after a create mutation resolves. Unlike {@link useSetEntityNames}, `ownerType`/`ownerId` are
 * passed at call time rather than bound when the hook is instantiated.
 */
export function useCreateEntityNames() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ownerType, ownerId, entries,
    }: {
      ownerType: EntityNameOwnerType;
      ownerId: string;
      entries: UpdateEntityNameEntry[];
    }) => entityNamesApi.put(ownerType, ownerId, entries),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(namesKey(variables.ownerType, variables.ownerId), data);
    },
  });
}

/** Replace an owner's full set of names. A primary entry also renames the owner's base name/title. */
export function useSetEntityNames(ownerType: EntityNameOwnerType, ownerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entries: UpdateEntityNameEntry[]) =>
      entityNamesApi.put(ownerType, ownerId, entries),
    onSuccess: (data) => {
      queryClient.setQueryData(namesKey(ownerType, ownerId), data);
      // A primary-name change renames the owner's base name/title column, so refresh its own reads.
      void queryClient.invalidateQueries({
        queryKey: [OWNER_QUERY_KEYS[ownerType]],
      });
    },
  });
}
