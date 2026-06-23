import type { CreateAuthorInput, UpdateAuthorInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authorsApi } from "../lib/api/taxonomies";

const AUTHORS_KEY = ["authors"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useAuthors() {
  return useQuery({
    queryKey: AUTHORS_KEY,
    queryFn: authorsApi.list,
  });
}

/** Look up a single author by its slug from the cached list. */
export function useAuthorBySlug(slug: string) {
  const query = useAuthors();
  return {
    ...query,
    author: (query.data ?? []).find(item => item.slug === slug),
  };
}

/** Look up a single author by its id from the cached list. */
export function useAuthorById(id: string | null | undefined) {
  const query = useAuthors();
  return {
    ...query,
    author: id ? (query.data ?? []).find(item => item.id === id) : undefined,
  };
}

export function useCreateAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAuthorInput) => authorsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: AUTHORS_KEY,
      });
    },
  });
}

export function useUpdateAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateAuthorInput; }) => authorsApi.update(id, input),
    onSuccess: () => {
      // A rename ripples into bookmark reads (each carries its authors).
      void queryClient.invalidateQueries({
        queryKey: AUTHORS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useDeleteAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authorsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: AUTHORS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}
