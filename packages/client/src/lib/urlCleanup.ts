export type UrlCleanupMode = "none" | "trackers" | "all";

export const TRACKING_PARAMS: ReadonlySet<string> = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "gclid", "msclkid", "gbraid", "wbraid", "dclid",
  "mc_cid", "mc_eid", "yclid", "ttclid", "twclid",
  "_ga", "_gl", "hsa_acc", "hsa_ad", "hsa_cam", "hsa_grp",
  "hsa_kw", "hsa_mt", "hsa_net", "hsa_src", "hsa_tgt", "hsa_ver",
  "li_fat_id", "igshid", "awc", "ef_id", "s_kwcid", "siid",
]);

export function cleanUrl(url: string, mode: UrlCleanupMode): string {
  if (mode === "none") return url;
  try {
    const parsed = new URL(url);
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
  catch {
    return url;
  }
}
