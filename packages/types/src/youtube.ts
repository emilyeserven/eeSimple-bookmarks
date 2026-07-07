/**
 * Pure YouTube URL helpers shared by the API (`@eesimple/middleware`) and the React client.
 * No network access — just URL parsing — so both packages can detect a YouTube video and build an
 * embed URL from the same logic.
 */

/**
 * Identify a YouTube video URL and return its 11-character video id, or `null` when the URL isn't a
 * recognizable YouTube video. Handles `youtube.com/watch?v=`, `youtu.be/<id>`, `/shorts/<id>`,
 * `/embed/<id>`, and `/live/<id>` on any youtube.com subdomain.
 */
export function parseYouTubeVideo(url: string): { videoId: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  }
  catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  const isValidId = (id: string | null | undefined): id is string => !!id && /^[\w-]{11}$/.test(id);

  if (host === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0];
    return isValidId(id)
      ? {
        videoId: id,
      }
      : null;
  }
  if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    if (parsed.pathname === "/watch") {
      const id = parsed.searchParams.get("v");
      return isValidId(id)
        ? {
          videoId: id,
        }
        : null;
    }
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length >= 2 && ["shorts", "embed", "live", "v"].includes(segments[0])) {
      return isValidId(segments[1])
        ? {
          videoId: segments[1],
        }
        : null;
    }
  }
  return null;
}

/** True when `url` points at a YouTube video. */
export function isYouTubeVideoUrl(url: string): boolean {
  return parseYouTubeVideo(url) !== null;
}

/**
 * Build an embed URL for a YouTube video URL, or `null` when `url` isn't a recognizable YouTube
 * video. `useNoCookie` (default `true`) selects the privacy-enhanced `youtube-nocookie.com` host
 * over plain `youtube.com` — a per-deploy preference, not a protocol fact.
 */
export function youtubeEmbedUrl(url: string, useNoCookie = true): string | null {
  const video = parseYouTubeVideo(url);
  if (!video) return null;
  const host = useNoCookie ? "www.youtube-nocookie.com" : "www.youtube.com";
  return `https://${host}/embed/${video.videoId}`;
}

/**
 * Reconstruct a browsable channel-page URL from a stored `channelKey`, inverting `channelKeyFromUrl`.
 * Handles (`@name`) and channel ids (`UC…`) round-trip exactly; bare vanity names fall back to the
 * `/c/<name>` path. Used to fetch a channel's avatar (its page `og:image`) on demand. Pure.
 */
export function channelUrlFromKey(channelKey: string): string {
  const key = channelKey.trim();
  if (key.startsWith("@")) return `https://www.youtube.com/${key}`;
  // Channel ids are "UC" followed by 22 url-safe chars; route them through `/channel/`.
  if (/^UC[\w-]{20,}$/.test(key)) return `https://www.youtube.com/channel/${key}`;
  return `https://www.youtube.com/c/${key}`;
}
