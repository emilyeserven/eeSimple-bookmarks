import { useMutation } from "@tanstack/react-query";

import { metadataApi } from "../lib/api";

/** Probes a URL via the middleware to see whether it still resolves. No cache to invalidate. */
export function useCheckUrl() {
  return useMutation({
    mutationFn: ({
      url,
    }: { url: string }) => metadataApi.checkUrl({
      url,
    }),
  });
}
