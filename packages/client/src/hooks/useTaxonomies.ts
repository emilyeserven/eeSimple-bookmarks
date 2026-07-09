import type {
  CreateTaxonomyInput,
  CreateTaxonomyTermInput,
  UpdateTaxonomyInput,
  UpdateTaxonomyTermInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { taxonomiesApi } from "../lib/api/taxonomies";
import { flattenTree } from "../lib/tagTree";

const TAXONOMIES_KEY = ["taxonomies"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

const termTreeKey = (taxonomyId: string) => [...TAXONOMIES_KEY, taxonomyId, "terms", "tree"] as const;

/** Every taxonomy (definitions only), ordered by sort order then name. */
export function useTaxonomies() {
  return useQuery({
    queryKey: TAXONOMIES_KEY,
    queryFn: taxonomiesApi.list,
  });
}

/** A single taxonomy resolved by slug from the cached list. */
export function useTaxonomyBySlug(slug: string) {
  const query = useTaxonomies();
  return {
    ...query,
    taxonomy: (query.data ?? []).find(item => item.slug === slug),
  };
}

/** A single taxonomy resolved by id from the cached list. */
export function useTaxonomyById(id: string) {
  const query = useTaxonomies();
  return {
    ...query,
    taxonomy: (query.data ?? []).find(item => item.id === id),
  };
}

/** A taxonomy's terms as a nested tree (roots first). */
export function useTaxonomyTermTree(taxonomyId: string | undefined) {
  return useQuery({
    queryKey: taxonomyId ? termTreeKey(taxonomyId) : [...TAXONOMIES_KEY, "terms", "none"],
    queryFn: () => taxonomiesApi.termTree(taxonomyId as string),
    enabled: Boolean(taxonomyId),
  });
}

/** A single term resolved by slug within a taxonomy (walks the nested tree). */
export function useTaxonomyTermBySlug(taxonomyId: string | undefined, termSlug: string) {
  const query = useTaxonomyTermTree(taxonomyId);
  return {
    ...query,
    term: flattenTree(query.data ?? []).find(item => item.node.slug === termSlug)?.node,
  };
}

/** Invalidate the taxonomy list, a taxonomy's term tree, and bookmark reads (terms ride on bookmarks). */
export function useTaxonomyInvalidation() {
  const queryClient = useQueryClient();
  return (taxonomyId?: string) => {
    void queryClient.invalidateQueries({
      queryKey: TAXONOMIES_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
    if (taxonomyId) {
      void queryClient.invalidateQueries({
        queryKey: termTreeKey(taxonomyId),
      });
    }
  };
}

export function useCreateTaxonomy() {
  const invalidate = useTaxonomyInvalidation();
  return useMutation({
    mutationFn: (input: CreateTaxonomyInput) => taxonomiesApi.create(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateTaxonomy() {
  const invalidate = useTaxonomyInvalidation();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateTaxonomyInput; }) => taxonomiesApi.update(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteTaxonomy() {
  const invalidate = useTaxonomyInvalidation();
  return useMutation({
    mutationFn: (id: string) => taxonomiesApi.remove(id),
    onSuccess: () => invalidate(),
  });
}

export function useBulkDeleteTaxonomies() {
  const invalidate = useTaxonomyInvalidation();
  return useBulkDeleteEntity(taxonomiesApi.bulkDelete, () => invalidate());
}

export function useCreateTaxonomyTerm(taxonomyId: string) {
  const invalidate = useTaxonomyInvalidation();
  return useMutation({
    mutationFn: (input: CreateTaxonomyTermInput) => taxonomiesApi.createTerm(taxonomyId, input),
    onSuccess: () => invalidate(taxonomyId),
  });
}

export function useUpdateTaxonomyTerm(taxonomyId: string) {
  const invalidate = useTaxonomyInvalidation();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateTaxonomyTermInput; }) => taxonomiesApi.updateTerm(id, input),
    onSuccess: () => invalidate(taxonomyId),
  });
}

export function useDeleteTaxonomyTerm(taxonomyId: string) {
  const invalidate = useTaxonomyInvalidation();
  return useMutation({
    mutationFn: (id: string) => taxonomiesApi.removeTerm(id),
    onSuccess: () => invalidate(taxonomyId),
  });
}

export function useBulkDeleteTaxonomyTerms(taxonomyId: string) {
  const invalidate = useTaxonomyInvalidation();
  return useBulkDeleteEntity(taxonomiesApi.bulkDeleteTerms, () => invalidate(taxonomyId));
}

/** Promote a tag subtree into its own taxonomy. */
export function usePromoteTagToTaxonomy() {
  const invalidate = useTaxonomyInvalidation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => taxonomiesApi.promoteTag(tagId),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({
        queryKey: ["tags"],
      });
    },
  });
}

/** Demote a taxonomy back into Tags. */
export function useDemoteTaxonomy() {
  const invalidate = useTaxonomyInvalidation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, parentTagId,
    }: { id: string;
      parentTagId?: string | null; }) => taxonomiesApi.demote(id, parentTagId),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({
        queryKey: ["tags"],
      });
    },
  });
}
