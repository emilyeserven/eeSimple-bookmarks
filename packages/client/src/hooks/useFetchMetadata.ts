import { useMutation } from "@tanstack/react-query";

import { metadataApi } from "../lib/api";

/**
 * Fetches rich metadata for a URL via the middleware: the page title for any URL, plus the channel,
 * duration, and thumbnail for recognized YouTube videos. No cache to invalidate.
 */
export function useFetchMetadata() {
  return useMutation({
    mutationFn: ({
      url, siteName,
    }: { url: string;
      siteName?: string; }) =>
      metadataApi.fetchMetadata({
        url,
        siteName,
      }),
  });
}
