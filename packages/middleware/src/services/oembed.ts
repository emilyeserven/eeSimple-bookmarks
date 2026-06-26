/**
 * Generalized oEmbed metadata fetching for non-YouTube URLs. Mirrors the keyless approach in
 * `services/youtube.ts`: a known-provider registry (`OEMBED_PROVIDERS` in `@eesimple/types`) plus
 * `<link rel="alternate" type="application/json+oembed">` autodiscovery from a page's `<head>`.
 *
 * Network calls reuse the guarded fetch + SSRF guard (`isPublicHttpUrl`) and image downloader from
 * `services/metadata.ts`. The pure parsers (`normalizeOEmbed`, `discoverOEmbedHref`) are exported
 * and unit-tested; the network helpers degrade to `null` rather than throwing.
 */

import { findOEmbedProvider, type NormalizedOEmbed } from "@eesimple/types";

import { downloadImage, isPublicHttpUrl } from "@/services/metadata";

const OEMBED_TIMEOUT_MS = 5000;

/** The subset of oEmbed JSON fields we consume — providers vary, so everything is `unknown`. */
interface RawOEmbed {
  title?: unknown;
  author_name?: unknown;
  author_url?: unknown;
  thumbnail_url?: unknown;
  description?: unknown;
  upload_date?: unknown;
  provider_name?: unknown;
}

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

/** Normalize an ISO-ish date string to `"YYYY-MM-DD"`, or `null`. Pure. */
function normalizeDate(raw: string | null): string | null {
  if (raw === null) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(raw.trim());
  return match ? match[1] : null;
}

/** Fetch oEmbed JSON from a known endpoint, guarded by a timeout. Returns `null` on failure. */
async function fetchOEmbedJson(endpoint: string): Promise<RawOEmbed | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OEMBED_TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "eeSimple-bookmarks/0.1 (+oembed)",
        "Accept": "application/json",
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as RawOEmbed;
  }
  catch {
    return null;
  }
  finally {
    clearTimeout(timeout);
  }
}

/**
 * Map a provider's raw oEmbed JSON to a `NormalizedOEmbed`. SSRF-guards the thumbnail and author
 * URLs (they come from a third party). Pure — unit-testable.
 */
export function normalizeOEmbed(raw: RawOEmbed, providerName: string | null): NormalizedOEmbed {
  const thumbnailUrl = asString(raw.thumbnail_url);
  const authorUrl = asString(raw.author_url);
  return {
    title: asString(raw.title),
    authorName: asString(raw.author_name),
    authorUrl: authorUrl && isPublicHttpUrl(authorUrl) ? authorUrl : null,
    thumbnailUrl: thumbnailUrl && isPublicHttpUrl(thumbnailUrl) ? thumbnailUrl : null,
    description: asString(raw.description),
    datePosted: normalizeDate(asString(raw.upload_date)),
    providerName: asString(raw.provider_name) ?? providerName,
  };
}

/**
 * Discover a page's oEmbed JSON endpoint from its `<head>`:
 * `<link rel="alternate" type="application/json+oembed" href="…">` (preferring JSON over the XML
 * variant). Resolves a relative href against `pageUrl`. Returns an absolute http(s) URL or `null`.
 * Pure — unit-testable.
 */
export function discoverOEmbedHref(html: string, pageUrl: string): string | null {
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    if (!/type=["']application\/json\+oembed["']/i.test(tag)) continue;
    const href = /href=["']([^"']*)["']/i.exec(tag);
    if (!href?.[1]) continue;
    try {
      const resolved = new URL(href[1].replace(/&amp;/g, "&"), pageUrl);
      if (resolved.protocol === "http:" || resolved.protocol === "https:") return resolved.href;
    }
    catch {
      // Skip a malformed href and try the next candidate.
    }
  }
  return null;
}

/**
 * Resolve oEmbed metadata for a non-YouTube URL: a known-provider endpoint first, then
 * autodiscovery from the supplied head HTML. Returns `null` when neither yields a usable result,
 * the endpoint isn't a public host, or every field came back empty.
 */
export async function fetchOEmbedForUrl(
  url: string,
  headHtml?: string | null,
): Promise<NormalizedOEmbed | null> {
  const provider = findOEmbedProvider(url);
  let endpoint = provider?.endpoint(url) ?? null;
  const providerName = provider?.name ?? null;

  if (endpoint === null && headHtml) {
    const discovered = discoverOEmbedHref(headHtml, url);
    if (discovered && isPublicHttpUrl(discovered)) endpoint = discovered;
  }
  if (endpoint === null || !isPublicHttpUrl(endpoint)) return null;

  const raw = await fetchOEmbedJson(endpoint);
  if (raw === null) return null;
  const normalized = normalizeOEmbed(raw, providerName);
  // A result with no usable text, author, or thumbnail isn't worth returning.
  if (
    normalized.title === null
    && normalized.description === null
    && normalized.thumbnailUrl === null
    && normalized.authorName === null
  ) {
    return null;
  }
  return normalized;
}

/**
 * Best-effort thumbnail bytes for a non-YouTube oEmbed URL: resolve the provider's oEmbed (known
 * providers only — no head HTML is passed, so autodiscovery is skipped), then download the
 * thumbnail (SSRF-guarded). Mirrors `fetchYouTubeThumbnail`. Returns `null` when there's no usable
 * thumbnail. Never throws.
 */
export async function fetchOEmbedThumbnail(url: string): Promise<Buffer | null> {
  const meta = await fetchOEmbedForUrl(url);
  if (!meta?.thumbnailUrl || !isPublicHttpUrl(meta.thumbnailUrl)) return null;
  return downloadImage(meta.thumbnailUrl, url);
}
