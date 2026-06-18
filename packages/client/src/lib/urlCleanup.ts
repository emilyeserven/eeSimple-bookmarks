export type UrlCleanupMode = "none" | "trackers" | "all";

export const TRACKING_PARAMS: ReadonlySet<string> = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "gclid", "msclkid", "gbraid", "wbraid", "dclid",
  "mc_cid", "mc_eid", "yclid", "ttclid", "twclid",
  "_ga", "_gl", "hsa_acc", "hsa_ad", "hsa_cam", "hsa_grp",
  "hsa_kw", "hsa_mt", "hsa_net", "hsa_src", "hsa_tgt", "hsa_ver",
  "li_fat_id", "igshid", "awc", "ef_id", "s_kwcid", "siid",
]);

/** True when `parsed`'s host is youtube.com (any subdomain) or the youtu.be short domain. */
function isYouTubeHost(parsed: URL): boolean {
  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  return host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be";
}

/**
 * Reduce a YouTube URL to its canonical, param-free form so equivalent links dedupe and tracking
 * params drop. Keeps only the param that identifies the resource:
 *   - `youtube.com/watch`    → keep `v` (the video id), drop `list`, `index`, `si`, `t`, …
 *   - `youtube.com/playlist` → keep `list` (the playlist id)
 *   - everything else (`/shorts`, `/embed`, `/live`, `youtu.be/<id>`, …) → strip all query params
 * Returns the input unchanged when it isn't a parseable YouTube URL. Pure.
 */
export function canonicalizeYouTubeUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  }
  catch {
    return url;
  }
  if (!isYouTubeHost(parsed)) return url;

  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  const keep
    = host !== "youtu.be" && parsed.pathname === "/watch"
      ? "v"
      : host !== "youtu.be" && parsed.pathname === "/playlist"
        ? "list"
        : null;

  const value = keep ? parsed.searchParams.get(keep) : null;
  if (keep && value !== null) {
    const next = new URLSearchParams();
    next.set(keep, value);
    parsed.search = next.toString();
  }
  else {
    parsed.search = "";
  }
  return parsed.toString();
}

export function cleanUrl(url: string, mode: UrlCleanupMode): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  }
  catch {
    return url;
  }
  // YouTube URLs are always canonicalized to a single identifying param, independent of `mode` —
  // this both strips trackers and protects the `v`/`list` param from `mode === "all"`.
  if (isYouTubeHost(parsed)) return canonicalizeYouTubeUrl(url);
  if (mode === "none") return url;
  if (mode === "all") {
    parsed.search = "";
  }
  else {
    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key)) parsed.searchParams.delete(key);
    }
  }
  return parsed.toString();
}
