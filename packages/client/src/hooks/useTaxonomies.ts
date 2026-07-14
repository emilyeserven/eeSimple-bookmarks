import type {
  CreateTaxonomyInput,
  CreateTaxonomyTermInput,
  UpdateTaxonomyInput,
  UpdateTaxonomyTermInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { taxonomiesApi } from "../lib/api/taxonomies";
import { notifyError, notifySuccess } from "../lib/notifications";
import { flattenTree } from "../lib/tagTree";

const TAXONOMIES_KEY = ["taxonomies"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;
const FAVORITE_TERMS_KEY = ["taxonomy-terms", "favorites"] as const;

const termTreeKey = (taxonomyId: string) => [...TAXONOMIES_KEY, taxonomyId, "terms", "tree"] as const;

/** Every starred taxonomy term across all taxonomies — feeds each taxonomy's sidebar flyout. */
export function useFavoriteTaxonomyTerms() {
  return useQuery({
    queryKey: FAVORITE_TERMS_KEY,
    queryFn: taxonomiesApi.favoriteTerms,
  });
}

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

/** A taxonomy's terms as a nested tree (roots first). */
export function useTaxonomyTermTree(taxonomyId: string | undefined) {
  return useQuery({
    queryKey: taxonomyId ? termTreeKey(taxonomyId) : [...TAXONOMIES_KEY, "terms", "none"],
    queryFn: () => taxonomiesApi.termTree(taxonomyId as string),
    enabled: Boolean(taxonomyId),
  });
}

/** Look up a single term by its slug from the cached tree (walks nested nodes). */
export function useTaxonomyTermBySlug(taxonomyId: string | undefined, slug: string) {
  const query = useTaxonomyTermTree(taxonomyId);
  return {
    ...query,
    term: flattenTree(query.data ?? []).find(item => item.node.slug === slug)?.node,
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
    void queryClient.invalidateQueries({
      queryKey: FAVORITE_TERMS_KEY,
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

/**
 * Star toggle for a custom-taxonomy term (the term-level analog of `useFavoriteToggle`, which only
 * covers registry kinds). Backed by the term PATCH; fires the standard Starred/Unstarred toast.
 */
export function useTaxonomyTermFavoriteToggle(taxonomyId: string) {
  const update = useUpdateTaxonomyTerm(taxonomyId);
  const {
    t,
  } = useTranslation();
  return {
    toggle: (item: { id: string;
      name: string;
      isFavorite: boolean; }) => {
      const next = !item.isFavorite;
      update.mutate({
        id: item.id,
        input: {
          isFavorite: next,
        },
      }, {
        onSuccess: () =>
          notifySuccess(next
            ? t("Starred {{name}}", {
              name: item.name,
            })
            : t("Unstarred {{name}}", {
              name: item.name,
            })),
        onError: error => notifyError(error.message),
      });
    },
  };
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
