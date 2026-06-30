/**
 * Instagram connector — pulls every image of a post/reel (including all carousel slides) at full
 * size from Instagram's public, keyless embed endpoint. Used by the scan pipeline so the Add
 * Bookmark form can offer all of a carousel's images instead of just the single square `og:image`.
 *
 * Best-effort: Instagram can rate-limit or wall the embed (especially from datacenter IPs), so every
 * failure path returns `[]` and the caller falls back to the hosted provider, then the og:image.
 */

import type { ImageCandidate } from "@eesimple/types";
import { instagramPermalinkFromUrl, normalizeSocialHandle, socialAccountFromUrl } from "@eesimple/types";

import { decodeEntities, fetchBodyHtmlResult, metaContent } from "@/services/metadata";

/** Whether `url` is an Instagram post or reel permalink (the shapes that carry shareable images). */
export function isInstagramPostUrl(url: string): boolean {
  return shortcodeFromUrl(url) !== null;
}

/**
 * Extract the post/reel shortcode from an Instagram URL, or null when it isn't one. Handles `/p/`,
 * `/reel/`, and `/tv/` permalinks, with or without a trailing `?img_index=` / other query. Thin
 * wrapper over the shared {@link instagramPermalinkFromUrl} so detection lives in one place.
 */
export function shortcodeFromUrl(url: string): string | null {
  return instagramPermalinkFromUrl(url)?.shortcode ?? null;
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

/** One node of the embed's `shortcode_media` (the post, or a carousel child) — only the bits we read. */
interface ShortcodeMediaNode {
  display_url?: unknown;
  edge_sidecar_to_children?: {
    edges?: { node?: { display_url?: unknown } }[];
  };
}

/**
 * Pull the post's `shortcode_media` object out of the embed's `contextJSON`. The captioned embed
 * carries the post as a JSON-*string* value (`"contextJSON":"{…}"`, double-escaped) inside the
 * `["PolarisEmbedSimple","init",…]` script; decoding it twice (un-escape the string, then parse the
 * JSON) yields `gql_data.shortcode_media`. Returns null when the blob is absent or unparseable.
 */
function shortcodeMediaFromContextJSON(html: string): ShortcodeMediaNode | null {
  // `(?:[^"\\]|\\.)*` matches the JSON-string body, honouring escaped quotes/backslashes.
  const match = /"contextJSON":"((?:[^"\\]|\\.)*)"/.exec(html);
  if (!match) return null;
  try {
    const jsonText = JSON.parse(`"${match[1]}"`) as string;
    const context = JSON.parse(jsonText) as { gql_data?: { shortcode_media?: ShortcodeMediaNode } };
    return context.gql_data?.shortcode_media ?? null;
  }
  catch {
    return null;
  }
}

/**
 * Collect the MAIN post's image URLs from a `shortcode_media` node: every carousel slide's
 * `display_url` (full size, in order) when it's a sidecar, otherwise the single top-level
 * `display_url`. Related "More posts" thumbnails and the owner's `profile_pic_url` live elsewhere in
 * the embed (HoverCard / Avatar `<img>` markup, not under `shortcode_media`), so they're excluded
 * structurally. Pure.
 */
function mainPostImageUrls(media: ShortcodeMediaNode): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  const push = (value: unknown): void => {
    if (typeof value === "string" && /^https?:\/\//i.test(value) && !seen.has(value)) {
      seen.add(value);
      urls.push(value);
    }
  };
  const children = media.edge_sidecar_to_children?.edges;
  if (Array.isArray(children) && children.length > 0) {
    for (const edge of children) push(edge.node?.display_url);
  }
  else {
    push(media.display_url);
  }
  return urls;
}

/**
 * Parse an Instagram embed page's HTML into the MAIN post's image candidates. Reads Instagram's own
 * structured `contextJSON → gql_data.shortcode_media` (the carousel slides at full size, or the
 * single image), which excludes the embed's "More posts" thumbnails and the profile picture for free
 * — they aren't part of `shortcode_media`. Falls back to a legacy `display_url` scan (older
 * `window.__additionalDataLoaded` embeds) and then the page's `og:image`. Pure — unit-testable.
 */
export function parseInstagramEmbed(html: string): ImageCandidate[] {
  const toCandidate = (url: string): ImageCandidate => ({
    url,
    source: "instagram",
  });

  const media = shortcodeMediaFromContextJSON(html);
  if (media) {
    const urls = mainPostImageUrls(media);
    if (urls.length > 0) return urls.map(toCandidate);
  }

  // Secondary: older embeds inline the data as `window.__additionalDataLoaded('extra', {…})` with
  // single-escaped JSON, where the carousel `display_url`s sit under `edge_sidecar_to_children`.
  const sidecarIdx = html.search(/edge_sidecar_to_children/i);
  if (sidecarIdx >= 0) {
    const seen = new Set<string>();
    const candidates: ImageCandidate[] = [];
    for (const match of html.slice(sidecarIdx).matchAll(/"display_url":\s*"((?:[^"\\]|\\.)*)"/g)) {
      const url = decodeJsonString(match[1]);
      if (/^https?:\/\//i.test(url) && !seen.has(url)) {
        seen.add(url);
        candidates.push(toCandidate(url));
      }
    }
    if (candidates.length > 0) return candidates;
  }

  // Last resort: the post's own og:image (never a related/profile image).
  const og = metaContent(html, /property=["']og:image(?::url)?["']/i);
  const url = og ? decodeEntities(og).trim() : "";
  return /^https?:\/\//i.test(url) ? [toCandidate(url)] : [];
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

/**
 * Extract the account's profile/avatar image URL from an Instagram profile or embed page's HTML, or
 * null. The profile picture lives OUTSIDE `shortcode_media` (the post payload) — it's exposed as
 * `profile_pic_url_hd` / `profile_pic_url` in the page JSON, and as the page's `og:image` on a
 * profile URL. Tries the HD variant first, then the standard one, then `og:image`. Pure.
 */
export function parseInstagramProfileImageUrl(html: string): string | null {
  for (const key of ["profile_pic_url_hd", "profile_pic_url"]) {
    const match = new RegExp(`"${key}":"((?:[^"\\\\]|\\\\.)*)"`).exec(html);
    if (match) {
      const url = decodeJsonString(match[1]);
      if (/^https?:\/\//i.test(url)) return url;
    }
  }
  const og = metaContent(html, /property=["']og:image(?::url)?["']/i);
  const url = og ? decodeEntities(og).trim() : "";
  return /^https?:\/\//i.test(url) ? url : null;
}

/**
 * Best-effort, keyless fetch of an Instagram account's avatar URL. Accepts a handle or a profile
 * URL. Tries the account's `/embed/` page first (less aggressively walled than the bare profile),
 * then the profile page itself. Returns the avatar URL string, or null on any failure. Never throws.
 */
export async function fetchInstagramProfileImageUrl(handleOrUrl: string): Promise<string | null> {
  const handle = handleOrUrl.includes("/")
    ? socialAccountFromUrl(handleOrUrl)?.handle ?? null
    : normalizeSocialHandle(handleOrUrl);
  if (!handle) return null;

  for (const pageUrl of [
    `https://www.instagram.com/${handle}/embed/`,
    `https://www.instagram.com/${handle}/`,
  ]) {
    const result = await fetchBodyHtmlResult(pageUrl, /<\/html>/i);
    if (result.kind !== "ok") continue;
    const imageUrl = parseInstagramProfileImageUrl(result.html);
    if (imageUrl) return imageUrl;
  }
  return null;
}
