import { useMutation } from "@tanstack/react-query";

import { metadataApi } from "../lib/api/metadata";

/** Fetches a page title for a URL via the middleware. No cache to invalidate. */
export function useFetchTitle() {
  return useMutation({
    mutationFn: ({
      url, siteName,
    }: { url: string;
      siteName?: string; }) =>
      metadataApi.fetchTitle({
        url,
        siteName,
      }),
  });
}
