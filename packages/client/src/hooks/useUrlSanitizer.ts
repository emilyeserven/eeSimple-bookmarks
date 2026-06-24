import { useCustomStripParams, useShortenerIgnoreList } from "./useAppSettings";
import { useWebsites } from "./useWebsites";
import { cleanUrl } from "../lib/urlCleanup";

/**
 * Returns a `sanitizeUrl(url)` that canonicalizes a pasted URL the same way the bookmark form does on
 * blur: it trims the value, strips known tracking params, and expands verified shortened links via the
 * shared `cleanUrl` (so tracker stripping / shortened-link expansion is never re-implemented). Non-URLs
 * pass through unchanged. Reuses the cached websites + shortener-ignore-list queries, so a component
 * with a one-off "paste a URL" field can sanitize on blur without re-wiring the canonicalize inputs.
 */
export function useUrlSanitizer(): (url: string) => string {
  const {
    data: websites = [],
  } = useWebsites();
  const {
    data: ignoreList = [],
  } = useShortenerIgnoreList();
  const {
    data: customStripParams = [],
  } = useCustomStripParams();
  return (url: string) =>
    cleanUrl(url.trim(), {
      mode: "trackers",
      websites,
      ignoreList,
      customStripParams,
    });
}
