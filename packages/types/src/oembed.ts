/**
 * Shared oEmbed provider registry + normalized result shape.
 *
 * oEmbed (https://oembed.com) is a keyless protocol many media sites expose to return clean,
 * structured metadata (title / person / thumbnail) for a content URL. This registry maps known
 * provider URLs to their oEmbed JSON endpoints; the middleware additionally performs
 * `<link rel="alternate" type="application/json+oembed">` autodiscovery for sites not listed here.
 *
 * Kept in `@eesimple/types` so the list is a single source of truth shared by the middleware scan
 * path and the client (e.g. the Connectors settings page describes the supported providers from
 * `OEMBED_PROVIDERS`). To support a new provider, add an entry here — and nowhere else.
 */

/** A known oEmbed provider: how to recognize its content URLs and where to fetch its oEmbed JSON. */
export interface OEmbedProvider {
  /** Human-readable provider name (shown in the Connectors settings page). */
  name: string;
  /** Whether this provider handles the given content URL. */
  matches: (url: string) => boolean;
  /** Build the provider's oEmbed JSON endpoint for the given content URL. */
  endpoint: (url: string) => string;
  /**
   * Whether the provider's `thumbnail_url` is trustworthy as the bookmark's preview image. Defaults
   * to `true` when omitted. Set `false` for providers whose oEmbed thumbnail is a generic/placeholder
   * image unrelated to the specific content (e.g. Reddit returns a subreddit icon rather than a
   * post's actual image) — the title/person/description still come from oEmbed, but the image
   * pipeline falls through to the page's own scraped `og:image` instead.
   */
  trustThumbnail?: boolean;
}

/** Parse a URL's lowercased hostname, or `null` when it isn't a valid absolute URL. */
function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  }
  catch {
    return null;
  }
}

/** True when `url`'s host equals one of `hosts` or is a subdomain of one. */
function hostMatches(url: string, hosts: readonly string[]): boolean {
  const host = hostnameOf(url);
  if (host === null) return false;
  return hosts.some(h => host === h || host.endsWith(`.${h}`));
}

/** Build a `?url=<encoded>&format=json` oEmbed endpoint (the shape most providers use). */
function jsonEndpoint(base: string, url: string): string {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}url=${encodeURIComponent(url)}&format=json`;
}

/**
 * Known keyless oEmbed providers. YouTube is intentionally absent — it has its own dedicated
 * metadata path (`services/youtube.ts`) that also scrapes duration/date. Add a provider here to
 * support it everywhere the scan/metadata pipeline runs.
 */
export const OEMBED_PROVIDERS: readonly OEmbedProvider[] = [
  {
    name: "Vimeo",
    matches: url => hostMatches(url, ["vimeo.com"]),
    endpoint: url => jsonEndpoint("https://vimeo.com/api/oembed.json", url),
  },
  {
    name: "Spotify",
    matches: url => hostMatches(url, ["spotify.com"]),
    endpoint: url => jsonEndpoint("https://open.spotify.com/oembed", url),
  },
  {
    name: "SoundCloud",
    matches: url => hostMatches(url, ["soundcloud.com"]),
    endpoint: url => jsonEndpoint("https://soundcloud.com/oembed", url),
  },
  {
    name: "TikTok",
    matches: url => hostMatches(url, ["tiktok.com"]),
    endpoint: url => jsonEndpoint("https://www.tiktok.com/oembed", url),
  },
  {
    name: "X (Twitter)",
    matches: url => hostMatches(url, ["twitter.com", "x.com"]),
    endpoint: url => jsonEndpoint("https://publish.twitter.com/oembed", url),
  },
  {
    name: "Reddit",
    matches: url => hostMatches(url, ["reddit.com"]),
    endpoint: url => jsonEndpoint("https://www.reddit.com/oembed", url),
    // Reddit's oEmbed `thumbnail_url` is very often a generic subreddit/community icon rather than
    // the post's actual submitted image — trust its title/person text but not its thumbnail.
    trustThumbnail: false,
  },
  {
    name: "Flickr",
    matches: url => hostMatches(url, ["flickr.com"]),
    endpoint: url => jsonEndpoint("https://www.flickr.com/services/oembed", url),
  },
];

/** Find the registered oEmbed provider that handles `url`, or `null` when none do. */
export function findOEmbedProvider(url: string): OEmbedProvider | null {
  return OEMBED_PROVIDERS.find(p => p.matches(url)) ?? null;
}

/**
 * A normalized oEmbed result, mapped from any provider's (or an autodiscovered endpoint's) raw
 * JSON. Every field is nullable — a provider may omit any of them.
 */
export interface NormalizedOEmbed {
  /** Clean content title (oEmbed titles carry no site-name suffix), or `null`. */
  title: string | null;
  /** Person/creator display name, or `null`. */
  authorName: string | null;
  /** Person/creator profile URL (SSRF-guarded by the middleware), or `null`. */
  authorUrl: string | null;
  /** Preview/thumbnail image URL (SSRF-guarded by the middleware), or `null`. */
  thumbnailUrl: string | null;
  /** Short description, when the provider supplies one, else `null`. */
  description: string | null;
  /** ISO-8601 publish date ("YYYY-MM-DD") when the provider supplies one, else `null`. */
  datePosted: string | null;
  /** The provider's self-reported name (oEmbed `provider_name`) or the registry name, else `null`. */
  providerName: string | null;
}
