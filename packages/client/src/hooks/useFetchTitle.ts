import { useMutation } from "@tanstack/react-query";

import { metadataApi } from "../lib/api";

/** Fetches a page title for a URL via the middleware. No cache to invalidate. */
export function useFetchTitle() {
  return useMutation({
    mutationFn: (url: string) => metadataApi.fetchTitle(url),
  });
}
