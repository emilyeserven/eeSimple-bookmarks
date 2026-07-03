import type { CreateGenreMoodInput, UpdateGenreMoodInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { genreMoodsApi } from "../lib/api/taxonomies";
import { flattenTree } from "../lib/tagTree";

const GENRE_MOODS_KEY = ["genre-moods"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useGenreMoods() {
  return useQuery({
    queryKey: GENRE_MOODS_KEY,
    queryFn: genreMoodsApi.list,
  });
}

/** The Genres & Moods taxonomy as a nested tree (roots first). */
export function useGenreMoodTree() {
  return useQuery({
    queryKey: [...GENRE_MOODS_KEY, "tree"],
    queryFn: genreMoodsApi.tree,
  });
}

/** Look up a single entry by its slug from the cached tree (walks nested nodes). */
export function useGenreMoodBySlug(slug: string) {
  const query = useGenreMoodTree();
  return {
    ...query,
    genreMood: flattenTree(query.data ?? []).find(item => item.node.slug === slug)?.node,
  };
}

export function useCreateGenreMood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGenreMoodInput) => genreMoodsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: GENRE_MOODS_KEY,
      });
    },
  });
}

export function useUpdateGenreMood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateGenreMoodInput; }) => genreMoodsApi.update(id, input),
    onSuccess: () => {
      // A rename ripples into bookmark reads (each carries its Genres & Moods entries).
      void queryClient.invalidateQueries({
        queryKey: GENRE_MOODS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useDeleteGenreMood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => genreMoodsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: GENRE_MOODS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useBulkDeleteGenreMoods() {
  const queryClient = useQueryClient();
  return useBulkDeleteEntity(genreMoodsApi.bulkDelete, () => {
    void queryClient.invalidateQueries({
      queryKey: GENRE_MOODS_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  });
}
