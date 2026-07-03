/**
 * Generic resolver for a social account's avatar URL. Keeps per-platform logic in one place so the
 * person-image service and routes stay platform-agnostic. Instagram is the only platform wired for
 * now; others return `null` (a clear extension point).
 *
 * Two tiers, mirroring the YouTube connector: an optional env-gated API path (Tier 2, used only when
 * `INSTAGRAM_API_KEY` is set) preferred for reliability, with the keyless public-embed scrape as the
 * always-available fallback. Every path returns `null` on failure and never throws, so callers can
 * treat "no avatar" uniformly.
 */

import type { SocialAccountRef } from "@eesimple/types";

import { fetchInstagramProfileImageUrl } from "@/services/instagram";
import { FETCH_TIMEOUT_MS } from "@/services/metadata";

/** Whether the Instagram API path is configured (Tier 2 — `INSTAGRAM_API_KEY` is set). */
export function instagramApiEnabled(): boolean {
  return Boolean(process.env.INSTAGRAM_API_KEY);
}

/**
 * Resolve an Instagram avatar URL via an optional third-party profile API (Tier 2). Operators point
 * `INSTAGRAM_API_ENDPOINT` at a JSON endpoint that accepts a `{handle}` placeholder and returns an
 * object carrying `profile_pic_url_hd` / `profile_pic_url`; `INSTAGRAM_API_KEY` is sent as a Bearer
 * token. Returns `null` on any failure so the caller falls back to the keyless scrape. Never throws.
 */
async function fetchInstagramProfileImageViaApi(handle: string): Promise<string | null> {
  const key = process.env.INSTAGRAM_API_KEY;
  const endpointTemplate = process.env.INSTAGRAM_API_ENDPOINT;
  if (!key || !endpointTemplate) return null;
  try {
    const endpoint = endpointTemplate.replace("{handle}", encodeURIComponent(handle));
    const res = await fetch(endpoint, {
      method: "GET",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${key}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json() as Record<string, unknown>;
    const url = data.profile_pic_url_hd ?? data.profile_pic_url;
    return typeof url === "string" && /^https?:\/\//i.test(url) ? url : null;
  }
  catch {
    return null;
  }
}

/**
 * Best-effort resolution of an avatar URL for a social account: the env-gated API path first (when
 * configured), then the keyless scrape. Returns a public image URL or `null`. Never throws.
 */
export async function fetchSocialProfileImageUrl(ref: SocialAccountRef): Promise<string | null> {
  if (ref.platform === "instagram") {
    if (instagramApiEnabled()) {
      const viaApi = await fetchInstagramProfileImageViaApi(ref.handle);
      if (viaApi) return viaApi;
    }
    return fetchInstagramProfileImageUrl(ref.handle);
  }
  // Other platforms aren't wired for avatar fetching yet.
  return null;
}
