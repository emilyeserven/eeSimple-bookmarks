import { useMutation } from "@tanstack/react-query";

import { metadataApi } from "../lib/api/metadata";

/** Fetches title, description, and cover image from Open Library for an ISBN/ASIN. */
export function useFetchIsbnMetadata() {
  return useMutation({
    mutationFn: ({
      isbn,
    }: { isbn: string }) =>
      metadataApi.fetchIsbnMetadata({
        isbn,
      }),
  });
}
