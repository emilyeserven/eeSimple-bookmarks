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
 * Narrow the embed HTML to the MAIN post's media, dropping the "More posts" / related-media section.
 * Instagram's embed JSON carries the post under `shortcode_media`, but the related posts under
 * `shortcode_media.edge_web_media_to_related_media` (and the captioned embed renders them in an
 * `EmbedRelatedMedia` container) — and those related nodes have their OWN `display_url` values. We
 * cut everything from the first related-section marker so those thumbnails never enter the scan.
 */
function mainPostRegion(html: string): string {
  const relatedIdx = html.search(/edge_web_media_to_related_media|EmbedRelatedMedia/i);
  return relatedIdx >= 0 ? html.slice(0, relatedIdx) : html;
}

/**
 * Parse an Instagram embed page's HTML into the MAIN post's image candidates. The embed carries each
 * image's full-size URL as a JSON-escaped `"display_url"` value — one per slide under
 * `edge_sidecar_to_children` for a carousel, or a single value for a non-carousel post. Related
 * ("More posts") thumbnails and the owner's `profile_pic_url` are deliberately excluded: the related
 * section is cut up front, and `profile_pic_url` is never a `display_url`. Falls back to the embed's
 * `og:image` (the post's own share image) when no media JSON is present. Pure — unit-testable.
 */
export function parseInstagramEmbed(html: string): ImageCandidate[] {
  const main = mainPostRegion(html);
  // Carousel slides live under `edge_sidecar_to_children`; scan from there so only the children's
  // `display_url`s are collected. With no sidecar it's a single-image post — keep just the first
  // `display_url` (the post image), not every `display_url` that might appear elsewhere in the JSON.
  const sidecarIdx = main.search(/edge_sidecar_to_children/i);
  const region = sidecarIdx >= 0 ? main.slice(sidecarIdx) : main;
  const limit = sidecarIdx >= 0 ? Infinity : 1;

  const seen = new Set<string>();
  const candidates: ImageCandidate[] = [];

  // `(?:[^"\\]|\\.)*` matches a JSON string body, honouring escaped quotes/backslashes.
  for (const match of region.matchAll(/"display_url":\s*"((?:[^"\\]|\\.)*)"/g)) {
    const url = decodeJsonString(match[1]);
    if (/^https?:\/\//i.test(url) && !seen.has(url)) {
      seen.add(url);
      candidates.push({
        url,
        source: "instagram",
      });
      if (candidates.length >= limit) break;
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
