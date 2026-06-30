/**
 * Instagram connector — pulls every image of a post/reel (including all carousel slides) at full
 * size from Instagram's public, keyless embed endpoint. Used by the scan pipeline so the Add
 * Bookmark form can offer all of a carousel's images instead of just the single square `og:image`.
 *
 * Best-effort: Instagram can rate-limit or wall the embed (especially from datacenter IPs), so every
 * failure path returns `[]` and the caller falls back to the hosted provider, then the og:image.
 */

import type { ImageCandidate } from "@eesimple/types";

import { decodeEntities, fetchBodyHtmlResult, metaContent } from "@/services/metadata";

/** Whether `url` is an Instagram post or reel permalink (the shapes that carry shareable images). */
export function isInstagramPostUrl(url: string): boolean {
  return shortcodeFromUrl(url) !== null;
}

/**
 * Extract the post/reel shortcode from an Instagram URL, or null when it isn't one. Handles `/p/`,
 * `/reel/`, and `/tv/` permalinks, with or without a trailing `?img_index=` / other query.
 */
export function shortcodeFromUrl(url: string): string | null {
  let host: string;
  let pathname: string;
  try {
    const parsed = new URL(url);
    host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    pathname = parsed.pathname;
  }
  catch {
    return null;
  }
  if (host !== "instagram.com" && !host.endsWith(".instagram.com")) return null;
  const match = /\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/.exec(pathname);
  return match ? match[1] : null;
}

/** Reverse JSON string-escaping (`&`, `\/`, …) on a captured embed value. */
function decodeJsonString(raw: string): string {
  try {
    return JSON.parse(`"${raw}"`) as string;
  }
  catch {
    return raw.replace(/\\\//g, "/").replace(/\\u0026/gi, "&");
  }
}

/**
 * Parse an Instagram embed page's HTML into the post's image candidates. The embed carries each
 * image's full-size URL as a JSON-escaped `"display_url"` value (one per carousel slide; a single
 * value for non-carousel posts). Falls back to the embed's `og:image` when no carousel JSON is
 * present. Pure — unit-testable on a fixture.
 */
export function parseInstagramEmbed(html: string): ImageCandidate[] {
  const seen = new Set<string>();
  const candidates: ImageCandidate[] = [];

  // `(?:[^"\\]|\\.)*` matches a JSON string body, honouring escaped quotes/backslashes.
  for (const match of html.matchAll(/"display_url":\s*"((?:[^"\\]|\\.)*)"/g)) {
    const url = decodeJsonString(match[1]);
    if (/^https?:\/\//i.test(url) && !seen.has(url)) {
      seen.add(url);
      candidates.push({
        url,
        source: "instagram",
      });
    }
  }

  if (candidates.length === 0) {
    const og = metaContent(html, /property=["']og:image(?::url)?["']/i);
    const url = og ? decodeEntities(og).trim() : "";
    if (/^https?:\/\//i.test(url)) {
      candidates.push({
        url,
        source: "instagram",
      });
    }
  }

  return candidates;
}

/**
 * Fetch all of an Instagram post/reel's images (full size) via its public embed endpoint. Returns an
 * ordered list (first image first), or `[]` when the URL isn't an Instagram post or the embed can't
 * be fetched/parsed. Never throws.
 */
export async function fetchInstagramCarousel(url: string): Promise<ImageCandidate[]> {
  const shortcode = shortcodeFromUrl(url);
  if (!shortcode) return [];
  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  const result = await fetchBodyHtmlResult(embedUrl, /<\/html>/i);
  if (result.kind !== "ok") return [];
  return parseInstagramEmbed(result.html);
}
