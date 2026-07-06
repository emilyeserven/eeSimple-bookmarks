import { useMutation } from "@tanstack/react-query";

import { metadataApi } from "../lib/api/metadata";

/** Resolves an Amazon product URL to an ISBN-13 (from the ASIN or scraped from the page). */
export function useIsbnFromAmazonUrl() {
  return useMutation({
    mutationFn: ({
      url,
    }: { url: string }) =>
      metadataApi.isbnFromAmazonUrl({
        url,
      }),
  });
}
