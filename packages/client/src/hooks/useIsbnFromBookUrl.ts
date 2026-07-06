import { useMutation } from "@tanstack/react-query";

import { metadataApi } from "../lib/api/metadata";

/** Resolves a book-site product URL (Amazon or honto.jp) to an ISBN-13. */
export function useIsbnFromBookUrl() {
  return useMutation({
    mutationFn: ({
      url,
    }: { url: string }) =>
      metadataApi.isbnFromBookUrl({
        url,
      }),
  });
}
