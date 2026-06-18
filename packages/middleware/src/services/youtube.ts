/**
 * YouTube-specific metadata extraction. Pulls a video's title, thumbnail, channel, and duration
 * from public, unauthenticated sources — no API key required:
 *  - title / thumbnail / channel come from YouTube's oEmbed endpoint (clean JSON);
 *  - duration is scraped from the watch page's `<meta itemprop="duration">` (ISO-8601), which oEmbed
 *    does not provide.
 *
 * The pure parsers (`parseYouTubeVideo`, `parseIsoDuration`) are exported and unit-tested; the
 * network call reuses the guarded fetch helpers from `metadata.ts`.
 */

import { isYouTubeVideoUrl, parseYouTubeVideo } from "@eesimple/types";

import { fetchHeadHtml, isPublicHttpUrl, metaContent } from "@/services/metadata";

// Re-exported so existing intra-package importers (and tests) keep their `@/services/youtube` path;
// the pure parsers now live in `@eesimple/types` so the client can share them.
export { isYouTubeVideoUrl, parseYouTubeVideo };

const OEMBED_TIMEOUT_MS = 5000;

/** What we can resolve for a YouTube video. Any field may be absent if a source omits it. */
export interface YouTubeMetadata {
  title: string | null;
  thumbnailUrl: string | null;
  channelName: string | null;
  channelUrl: string | null;
  durationSeconds: number | null;
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

/** Scrape the watch page's `<meta itemprop="duration">` (ISO-8601) and convert it to seconds. */
async function fetchDurationSeconds(videoId: string): Promise<number | null> {
  const html = await fetchHeadHtml(`https://www.youtube.com/watch?v=${videoId}`);
  if (!html) return null;
  const iso = metaContent(html, /itemprop=["']duration["']/i);
  return iso ? parseIsoDuration(iso) : null;
}

/**
 * Resolve metadata for a YouTube video URL, or `null` when `url` isn't a YouTube video. Combines
 * oEmbed (title/thumbnail/channel) with a duration scrape. Network failures degrade to `null`
 * fields rather than throwing, so a partial result is still useful.
 */
export async function fetchYouTubeMetadata(url: string): Promise<YouTubeMetadata | null> {
  const video = parseYouTubeVideo(url);
  if (!video) return null;

  const [oembed, durationSeconds] = await Promise.all([
    fetchOEmbed(url),
    fetchDurationSeconds(video.videoId),
  ]);

  const thumbnailUrl = asString(oembed?.thumbnail_url);
  const channelUrl = asString(oembed?.author_url);
  return {
    title: asString(oembed?.title),
    // Only surface third-party URLs that pass the SSRF guard, matching the image pipeline.
    thumbnailUrl: thumbnailUrl && isPublicHttpUrl(thumbnailUrl) ? thumbnailUrl : null,
    channelName: asString(oembed?.author_name),
    channelUrl: channelUrl && isPublicHttpUrl(channelUrl) ? channelUrl : null,
    durationSeconds,
  };
}
