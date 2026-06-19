/**
 * YouTube-specific metadata extraction. Pulls a video's title, thumbnail, channel, duration, and
 * publish date from public, unauthenticated sources — no API key required:
 *  - title / thumbnail / channel come from YouTube's oEmbed endpoint (clean JSON);
 *  - duration / publish date are scraped from the watch page (which oEmbed omits): preferring the
 *    embedded `ytInitialPlayerResponse` JSON and falling back to the schema.org
 *    `<meta itemprop="duration"/"datePublished">` microdata.
 *
 * Every scrape failure is recorded as a `warnings` entry (and logged) rather than silently
 * collapsed to `null`, so a partial result explains itself. The pure parsers (`parseYouTubeVideo`,
 * `parseIsoDuration`) are exported and unit-tested; the network call reuses the guarded fetch
 * helpers from `metadata.ts`.
 */

import { isYouTubeVideoUrl, parseYouTubeVideo } from "@eesimple/types";

import { downloadImage, fetchBodyHtmlResult, isPublicHttpUrl, metaContent } from "@/services/metadata";

// Re-exported so existing intra-package importers (and tests) keep their `@/services/youtube` path;
// the pure parsers now live in `@eesimple/types` so the client can share them.
export { isYouTubeVideoUrl, parseYouTubeVideo };

const OEMBED_TIMEOUT_MS = 5000;

/** What we can resolve for a YouTube video. Any field may be absent if a source omits it. */
export interface YouTubeMetadata {
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  channelName: string | null;
  channelUrl: string | null;
  durationSeconds: number | null;
  /** ISO-8601 publish date ("YYYY-MM-DD") scraped from the watch page, or `null`. */
  datePosted: string | null;
  /**
   * Human-readable reasons a field could not be resolved (watch-page fetch failed, value absent or
   * unparseable). Empty when everything resolved. Surfaced so a partial result explains itself
   * instead of returning a silent `null`.
   */
  warnings: string[];
}

/** Tagged log line so the whole YouTube metadata-scrape path is greppable in production. */
function ytmLog(message: string): void {
  console.warn(`[youtube-metadata] ${message}`);
}

/**
 * Parse an ISO-8601 duration (e.g. `"PT1H2M3S"`, `"PT4M20S"`, `"PT45S"`) into whole seconds.
 * Returns `null` for anything that isn't a positive time-only ISO-8601 duration. Pure.
 */
export function parseIsoDuration(iso: string): number | null {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso.trim());
  if (!match || (!match[1] && !match[2] && !match[3])) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : null;
}

/** Shape of the bits of YouTube's oEmbed JSON response we consume. */
interface OEmbedResponse {
  title?: unknown;
  thumbnail_url?: unknown;
  author_name?: unknown;
  author_url?: unknown;
}

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

/** Fetch YouTube's oEmbed JSON for a video URL, guarded by a timeout. Returns `null` on failure. */
async function fetchOEmbed(videoUrl: string): Promise<OEmbedResponse | null> {
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OEMBED_TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "eeSimple-bookmarks/0.1 (+youtube-metadata)",
        "Accept": "application/json",
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as OEmbedResponse;
  }
  catch {
    return null;
  }
  finally {
    clearTimeout(timeout);
  }
}

/** Normalize a YouTube publish/upload date (e.g. `"2024-06-15T00:00:00-07:00"`) to `"YYYY-MM-DD"`, or `null`. */
function normalizeDate(raw: string): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(raw.trim());
  return match ? match[1] : null;
}

/** A watch-page scrape outcome plus the reasons any field is missing. */
interface WatchPageMeta {
  durationSeconds: number | null;
  description: string | null;
  datePosted: string | null;
  warnings: string[];
}

/**
 * Scrape the watch page for duration, publish date, and description. Reads into the body (the data
 * of interest lives after `</head>`): prefers the embedded `ytInitialPlayerResponse` JSON
 * (`videoDetails.lengthSeconds`, `microformat…publishDate`) and falls back to the schema.org
 * `<meta itemprop="duration"/"datePublished">` microdata. Every failure (fetch error, absent or
 * unparseable value) is recorded as a warning rather than silently collapsed to `null`.
 */
async function fetchWatchPageMeta(videoId: string): Promise<WatchPageMeta> {
  const warnings: string[] = [];
  // Stop once the player response's `publishDate` is in hand (it follows `lengthSeconds`), or at the
  // end of the body / the byte cap. Keeps the read small on the common path.
  const result = await fetchBodyHtmlResult(
    `https://www.youtube.com/watch?v=${videoId}`,
    /"publishDate"|<\/body>/i,
  );
  if (result.kind !== "ok") {
    const reason
      = result.kind === "http_error"
        ? `http_error ${result.status}`
        : result.kind;
    warnings.push(`watch-page fetch failed: ${reason}`);
    return {
      durationSeconds: null,
      description: null,
      datePosted: null,
      warnings,
    };
  }
  const {
    html,
  } = result;

  // Duration: JSON `lengthSeconds` first, then the ISO-8601 `itemprop="duration"` microdata.
  let durationSeconds: number | null = null;
  const jsonSeconds = /"lengthSeconds"\s*:\s*"(\d+)"/.exec(html)?.[1];
  if (jsonSeconds) {
    const n = Number(jsonSeconds);
    if (Number.isInteger(n) && n > 0) durationSeconds = n;
  }
  if (durationSeconds === null) {
    const iso = metaContent(html, /itemprop=["']duration["']/i);
    if (iso) {
      durationSeconds = parseIsoDuration(iso);
      if (durationSeconds === null) warnings.push(`duration value "${iso}" could not be parsed`);
    }
    else if (!jsonSeconds) {
      warnings.push("duration not found in watch page");
    }
  }

  // Date: JSON `publishDate`/`uploadDate` first, then the `itemprop="datePublished"` microdata.
  let datePosted: string | null = null;
  const rawJsonDate
    = /"publishDate"\s*:\s*"([^"]+)"/.exec(html)?.[1]
      ?? /"uploadDate"\s*:\s*"([^"]+)"/.exec(html)?.[1];
  const rawMicroDate = metaContent(html, /itemprop=["']datePublished["']/i);
  const rawDate = rawJsonDate ?? rawMicroDate;
  if (rawDate) {
    datePosted = normalizeDate(rawDate);
    if (datePosted === null) warnings.push(`date "${rawDate}" not in YYYY-MM-DD form`);
  }
  else {
    warnings.push("date not found in watch page");
  }

  const rawDescription = metaContent(html, /(?:property|name)=["']og:description["']/i);
  return {
    durationSeconds,
    description: rawDescription ? decodeEntities(rawDescription).trim() || null : null,
    datePosted,
    warnings,
  };
}

/** Decode common HTML entities in a string. */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Resolve metadata for a YouTube video URL, or `null` when `url` isn't a YouTube video. Combines
 * oEmbed (title/thumbnail/channel) with a duration scrape. Network failures degrade to `null`
 * fields rather than throwing, so a partial result is still useful.
 */
export async function fetchYouTubeMetadata(url: string): Promise<YouTubeMetadata | null> {
  const video = parseYouTubeVideo(url);
  if (!video) return null;

  const [oembed, watchPage] = await Promise.all([
    fetchOEmbed(url),
    fetchWatchPageMeta(video.videoId),
  ]);

  const warnings = [...watchPage.warnings];
  if (oembed === null) warnings.push("oEmbed lookup failed (title/channel/thumbnail unavailable)");
  // Log loudly so a partial scrape is visible in production logs, not just a silent `null`.
  for (const warning of warnings) ytmLog(`${url} — ${warning}`);

  const thumbnailUrl = asString(oembed?.thumbnail_url);
  const channelUrl = asString(oembed?.author_url);
  return {
    title: asString(oembed?.title),
    description: watchPage.description,
    // Only surface third-party URLs that pass the SSRF guard, matching the image pipeline.
    thumbnailUrl: thumbnailUrl && isPublicHttpUrl(thumbnailUrl) ? thumbnailUrl : null,
    channelName: asString(oembed?.author_name),
    channelUrl: channelUrl && isPublicHttpUrl(channelUrl) ? channelUrl : null,
    durationSeconds: watchPage.durationSeconds,
    datePosted: watchPage.datePosted,
    warnings,
  };
}

/**
 * Download the bytes of a YouTube video's thumbnail (from oEmbed's `thumbnail_url`), or `null` when
 * `url` isn't a YouTube video, oEmbed had no thumbnail, or the download fails. The thumbnail URL is
 * already SSRF-guarded by `fetchYouTubeMetadata`. Preferred over scraping `og:image` for YouTube.
 */
export async function fetchYouTubeThumbnail(url: string): Promise<Buffer | null> {
  const meta = await fetchYouTubeMetadata(url);
  if (!meta?.thumbnailUrl) return null;
  return downloadImage(meta.thumbnailUrl);
}
