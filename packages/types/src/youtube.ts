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
 * Build a privacy-friendly `youtube-nocookie.com` embed URL for a YouTube video URL, or `null` when
 * `url` isn't a recognizable YouTube video.
 */
export function youtubeEmbedUrl(url: string): string | null {
  const video = parseYouTubeVideo(url);
  return video ? `https://www.youtube-nocookie.com/embed/${video.videoId}` : null;
}
