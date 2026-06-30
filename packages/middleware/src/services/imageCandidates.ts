/**
 * Multi-image candidate extraction for the Add Bookmark scan. Collects every plausible image for a
 * URL — Instagram carousels (full size), oEmbed/og/twitter share images, JSON-LD images, and
 * article-content `<img>`s — then filters them through the SSRF guard and the operator's image-URL
 * blacklist so only public, allowed images reach the picker.
 *
 * For non-Instagram pages we deliberately scrape `<img>`s ONLY from an identifiable `<article>` /
 * `<main>` region (with `<header>`/`<nav>`/`<footer>`/`<aside>` removed), so banners and ad images
 * outside the content don't get pulled. The curated og/twitter/JSON-LD images are always included.
 *
 * The pure extractors/matchers are unit-tested directly (`imageCandidates.test.ts`); only
 * `buildImageCandidates` does network I/O.
 */

import type { ImageCandidate } from "@eesimple/types";

import { decodeEntities, fetchBodyHtmlResult, isPublicHttpUrl } from "@/services/metadata";
import { fetchInstagramCarousel, isInstagramPostUrl } from "@/services/instagram";

/** Minimum width/height (when a dimension is declared) for an article `<img>` to count — drops spacers/icons. */
const MIN_ARTICLE_IMAGE_DIM = 200;

/** URL fragments that mark an image as an ad/tracker/chrome asset rather than content. */
const AD_URL_PATTERN
  = /(?:\/ads?\/|doubleclick|googlesyndication|adservice|adsystem|\/pixel|[/_-]1x1[/_.-]|spacer|sprite|\/tracking|\/beacon|\/analytics|\/logo[s]?[/_.-]|\bavatar\b)/i;

/** Resolve a raw (possibly relative, possibly entity-encoded) URL against the page, or null. */
function resolveUrl(raw: string, pageUrl: string): string | null {
  const decoded = decodeEntities(raw).trim();
  if (!decoded) return null;
  try {
    const resolved = new URL(decoded, pageUrl);
    if (resolved.protocol === "http:" || resolved.protocol === "https:") return resolved.href;
  }
  catch {
    // Skip a malformed candidate.
  }
  return null;
}

/** Collect the `content` of every `<meta>` tag whose attributes match `attrMatch` (not just the first). */
function collectMetaContents(html: string, attrMatch: RegExp): string[] {
  const out: string[] = [];
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (!attrMatch.test(tag)) continue;
    const content = /content=["']([^"']*)["']/i.exec(tag);
    if (content?.[1]) out.push(content[1]);
  }
  return out;
}

/** Read a numeric attribute (e.g. width/height) off an `<img>` tag, or null when absent/non-numeric. */
function attrNumber(tag: string, name: string): number | null {
  const match = new RegExp(`\\b${name}=["']?(\\d+)`, "i").exec(tag);
  return match ? Number(match[1]) : null;
}

/** Read a string attribute off an `<img>` tag, or undefined. */
function attrValue(tag: string, name: string): string | undefined {
  const match = new RegExp(`\\b${name}=["']([^"']*)["']`, "i").exec(tag);
  return match?.[1];
}

/** Pick the largest-width URL from an `<img srcset>` attribute, resolved absolute, or null. */
function largestFromSrcset(tag: string, pageUrl: string): string | null {
  const srcset = attrValue(tag, "srcset") ?? attrValue(tag, "data-srcset");
  if (!srcset) return null;
  let best: string | null = null;
  let bestWidth = -1;
  for (const entry of srcset.split(",")) {
    const parts = entry.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) continue;
    const widthDescriptor = parts[1] ?? "";
    const width = /^(\d+)w$/.exec(widthDescriptor)?.[1];
    const numericWidth = width ? Number(width) : 0;
    if (numericWidth >= bestWidth) {
      const resolved = resolveUrl(parts[0], pageUrl);
      if (resolved) {
        best = resolved;
        bestWidth = numericWidth;
      }
    }
  }
  return best;
}

/**
 * Isolate the article-content region of a page: from the first `<article>`/`<main>` open tag to its
 * last matching close, with `<header>`/`<nav>`/`<footer>`/`<aside>` blocks removed. Returns null when
 * the page declares no such region (so we don't scrape arbitrary `<img>`s and risk pulling ads).
 */
function articleRegion(html: string): string | null {
  const open = /<(article|main)\b[^>]*>/i.exec(html);
  if (!open) return null;
  const tag = open[1].toLowerCase();
  const start = open.index;
  const closeRe = new RegExp(`</${tag}>`, "gi");
  closeRe.lastIndex = start;
  let end = html.length;
  let match: RegExpExecArray | null;
  while ((match = closeRe.exec(html)) !== null) {
    end = match.index + match[0].length;
  }
  return html
    .slice(start, end)
    .replace(/<(header|nav|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");
}

/** Pull image URLs out of any `<script type="application/ld+json">` blocks (Article/ImageObject `image`). */
function extractJsonLdImages(html: string, pageUrl: string): ImageCandidate[] {
  const out: ImageCandidate[] = [];
  const push = (value: unknown): void => {
    if (typeof value === "string") {
      const resolved = resolveUrl(value, pageUrl);
      if (resolved) out.push({
        url: resolved,
        source: "article",
      });
    }
    else if (Array.isArray(value)) {
      for (const item of value) push(item);
    }
    else if (value && typeof value === "object") {
      const url = (value as { url?: unknown }).url;
      if (typeof url === "string") push(url);
    }
  };
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
    }
    else if (node && typeof node === "object") {
      const record = node as Record<string, unknown>;
      if ("image" in record) push(record.image);
      if (Array.isArray(record["@graph"])) walk(record["@graph"]);
    }
  };
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(match[1].trim()));
    }
    catch {
      // Ignore unparseable JSON-LD blocks.
    }
  }
  return out;
}

/**
 * Extract candidate images from a page's HTML for the Add Bookmark picker: og/twitter share images,
 * JSON-LD images, and article-content `<img>`s (scoped to `<article>`/`<main>`). Relative URLs are
 * resolved against `pageUrl`. Order reflects priority (share images first, then article images); the
 * caller filters/dedupes via {@link filterCandidates}. Pure — unit-testable like `extractImageUrl`.
 */
export function extractArticleImageCandidates(html: string, pageUrl: string): ImageCandidate[] {
  const candidates: ImageCandidate[] = [];

  for (const raw of collectMetaContents(html, /(?:property|name)=["']og:image(?::url)?["']/i)) {
    const resolved = resolveUrl(raw, pageUrl);
    if (resolved) candidates.push({
      url: resolved,
      source: "og",
    });
  }
  for (const raw of collectMetaContents(html, /name=["']twitter:image(?::src)?["']/i)) {
    const resolved = resolveUrl(raw, pageUrl);
    if (resolved) candidates.push({
      url: resolved,
      source: "twitter",
    });
  }

  candidates.push(...extractJsonLdImages(html, pageUrl));

  const region = articleRegion(html);
  if (region) {
    for (const [tag] of region.matchAll(/<img\b[^>]*>/gi)) {
      const width = attrNumber(tag, "width");
      const height = attrNumber(tag, "height");
      if ((width !== null && width < MIN_ARTICLE_IMAGE_DIM) || (height !== null && height < MIN_ARTICLE_IMAGE_DIM)) {
        continue;
      }
      const url
        = largestFromSrcset(tag, pageUrl)
          ?? resolveUrl(attrValue(tag, "src") ?? "", pageUrl)
          ?? resolveUrl(attrValue(tag, "data-src") ?? "", pageUrl);
      if (!url || AD_URL_PATTERN.test(url)) continue;
      candidates.push({
        url,
        width,
        height,
        source: "article",
      });
    }
  }

  return candidates;
}

/** Escape a string for use as a literal inside a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whether `url` matches any blacklist pattern. Each pattern is a case-insensitive substring, or a
 * simple `*` glob anchored to the whole URL (e.g. `*.doubleclick.net/*`). Pure — unit-testable.
 */
export function matchesImageBlacklist(url: string, patterns: string[]): boolean {
  const haystack = url.toLowerCase();
  for (const raw of patterns) {
    const pattern = raw.trim().toLowerCase();
    if (!pattern) continue;
    if (pattern.includes("*")) {
      const source = `^${pattern.split("*").map(escapeRegExp).join(".*")}$`;
      if (new RegExp(source).test(haystack)) return true;
    }
    else if (haystack.includes(pattern)) {
      return true;
    }
  }
  return false;
}

/**
 * Drop non-public (SSRF) and blacklisted candidates, resolve each to an absolute URL, and dedupe by
 * resolved URL while preserving order. Every survivor is a public, allowed http(s) image. Pure.
 */
export function filterCandidates(candidates: ImageCandidate[], blacklist: string[]): ImageCandidate[] {
  const seen = new Set<string>();
  const out: ImageCandidate[] = [];
  for (const candidate of candidates) {
    let resolved: string;
    try {
      resolved = new URL(candidate.url).href;
    }
    catch {
      continue;
    }
    if (!isPublicHttpUrl(resolved)) continue;
    if (matchesImageBlacklist(resolved, blacklist)) continue;
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    out.push({
      ...candidate,
      url: resolved,
    });
  }
  return out;
}

/**
 * Build the full list of candidate images for a scanned URL. Instagram posts return their whole
 * carousel (full size) and short-circuit; every other page combines a pre-resolved oEmbed/hosted
 * thumbnail (`primaryUrl`, ranked first), the og/twitter/JSON-LD share images, and article-content
 * `<img>`s from a single body fetch. The result is SSRF- and blacklist-filtered. Best-effort: any
 * fetch failure simply yields fewer candidates, never throws.
 */
export async function buildImageCandidates(opts: {
  url: string;
  headHtml?: string | null;
  primaryUrl?: string | null;
  blacklist: string[];
}): Promise<ImageCandidate[]> {
  const {
    url, headHtml, primaryUrl, blacklist,
  } = opts;

  if (isInstagramPostUrl(url)) {
    const carousel = await fetchInstagramCarousel(url);
    if (carousel.length > 0) return filterCandidates(carousel, blacklist);
  }

  const collected: ImageCandidate[] = [];
  if (primaryUrl) collected.push({
    url: primaryUrl,
    source: "og",
  });
  if (headHtml) collected.push(...extractArticleImageCandidates(headHtml, url));

  // Article `<img>`s live in the body, which `buildGenericMetadataResult`'s head fetch didn't read.
  const body = await fetchBodyHtmlResult(url, /<\/html>/i);
  if (body.kind === "ok") collected.push(...extractArticleImageCandidates(body.html, url));

  return filterCandidates(collected, blacklist);
}
