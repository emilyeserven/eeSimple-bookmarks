import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import type { FetchIsbnMetadataResult, FetchMetadataResult, ResolveUrlResult, ScanResult, WebsiteLookup } from "@eesimple/types";
import { extractIsbn13FromAmazonUrl, isAmazonProductUrl, isHontoProductUrl, socialAccountFromUrl } from "@eesimple/types";
import { fetchAmazonIsbnFromPage } from "@/services/amazon";
import { getImageUrlBlacklist } from "@/services/appSettings";
import { checkBookmarkUrlDuplicate } from "@/services/bookmarks";
import { fetchHontoIsbnFromPage } from "@/services/honto";
import { buildImageCandidates, filterCandidates } from "@/services/imageCandidates";
import {
  checkUrl,
  duckDuckGoIconUrl,
  extractAuthorNames,
  extractDescription,
  extractLanguage,
  extractTitle,
  fetchHeadHtml,
  fetchPageTitle,
} from "@/services/metadata";
import { fetchHostedMetadata } from "@/services/hostedMetadata";
import { fetchIsbnMetadata } from "@/services/isbn";
import { fetchOEmbedForUrl } from "@/services/oembed";
import { unwrapRedirect, unwrapWithBrowserless } from "@/services/redirectUnwrap";
import { getCachedScan, scanCacheKey, setCachedScan } from "@/services/scanCache";
import { lookupWebsiteByUrl, stripSiteNameSuffix } from "@/services/websites";
import { fetchYouTubeMetadata, isYouTubeVideoUrl } from "@/services/youtube";
import { channelKeyFromUrl, getYouTubeChannelByKey } from "@/services/youtubeChannels";
import { normalizeLanguageCode } from "@/utils/languageCodes";
import { isValidUrl } from "@/utils/url";
import { ValidationError } from "@/utils/errors";

const fetchTitleQuery = {
  type: "object",
  required: ["url"],
  additionalProperties: false,
  properties: {
    url: {
      type: "string",
      format: "uri",
    },
    siteName: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

const scanQuery = {
  type: "object",
  required: ["url"],
  additionalProperties: false,
  properties: {
    url: {
      type: "string",
      format: "uri",
    },
    siteName: {
      type: "string",
      minLength: 1,
    },
    // The client sets this false for redirect-ignore-listed domains (e.g. docs.google.com).
    resolveRedirect: {
      type: "boolean",
      default: true,
    },
    // Optional identity fields (see #1072) so a rescan can also surface Plex/Kavita/ISBN/feed dupes.
    isbn: {
      type: "string",
      minLength: 1,
    },
    plexRatingKey: {
      type: "string",
      minLength: 1,
    },
    kavitaSeriesId: {
      type: "number",
    },
    feedUrl: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

/**
 * Strip a channel self-identifier suffix from a title (e.g. " - SNL" from an SNL video), trying each
 * `selfId` and returning the first that changes the title. Pure, so it is unit-testable.
 */
export function stripChannelSelfIdSuffix(title: string, selfIds: string[]): string {
  for (const selfId of selfIds) {
    const stripped = stripSiteNameSuffix(title, {
      siteName: selfId,
    });
    if (stripped !== title) return stripped;
  }
  return title;
}

/** oEmbed titles are already clean; fall back to a page-title fetch when oEmbed had none. */
async function resolveYouTubeTitle(url: string, oembedTitle: string | null): Promise<string | null> {
  if (oembedTitle !== null) return oembedTitle;
  const fallback = await fetchPageTitle(url);
  return fallback.kind === "ok" ? fallback.title : null;
}

/** A YouTube video is a single thumbnail, not a gallery — its candidate list is just that image. */
async function buildYouTubeImageCandidates(thumbnailUrl: string | null) {
  if (!thumbnailUrl) return [];
  return filterCandidates([{
    url: thumbnailUrl,
    source: "og",
  }], await getImageUrlBlacklist());
}

/** Build the `/api/fetch-metadata` response for a YouTube video URL (oEmbed + channel enrichment). */
async function buildYouTubeMetadataResult(
  url: string,
  log: FastifyBaseLogger,
): Promise<FetchMetadataResult> {
  const meta = await fetchYouTubeMetadata(url);
  const warnings = meta?.warnings ?? [];
  // Surface scrape failures loudly in the server log (req.log), not just the response.
  if (warnings.length > 0) {
    log.warn({
      url,
      warnings,
    }, "[youtube-metadata] scrape incomplete");
  }

  let title = await resolveYouTubeTitle(url, meta?.title ?? null);

  const channelKey = meta?.channelUrl ? channelKeyFromUrl(meta.channelUrl) : null;
  const existingChannel = channelKey ? await getYouTubeChannelByKey(channelKey) : null;
  const selfIds = existingChannel?.selfIds ?? [];
  if (title && selfIds.length > 0) title = stripChannelSelfIdSuffix(title, selfIds);

  const thumbnailUrl = meta?.thumbnailUrl ?? null;
  const imageCandidates = await buildYouTubeImageCandidates(thumbnailUrl);
  return {
    title,
    description: meta?.description ?? null,
    isYouTube: true,
    channel: meta?.channelName
      ? {
        name: meta.channelName,
        url: meta.channelUrl,
        key: channelKey,
        selfIds,
      }
      : null,
    durationSeconds: meta?.durationSeconds ?? null,
    datePosted: meta?.datePosted ?? null,
    thumbnailUrl,
    imageCandidates,
    authorNames: null,
    languageCode: meta?.languageCode ?? null,
    ...(warnings.length > 0 && {
      diagnostics: warnings,
    }),
  };
}

/**
 * Apply site-name suffix stripping to a raw title using the website's primary name, domain, and
 * any registered alternate names. Returns the stripped title, or `null` when `rawTitle` is null.
 */
function stripTitleSuffixes(
  rawTitle: string | null,
  opts: { siteName: string | undefined;
    domain: string | null;
    alternateNames?: string[] | null; },
): string | null {
  if (!rawTitle) return null;
  let title = stripSiteNameSuffix(rawTitle, {
    siteName: opts.siteName,
    domain: opts.domain,
  });
  if (title === rawTitle && opts.alternateNames && opts.alternateNames.length > 0) {
    for (const altName of opts.alternateNames) {
      const alt = stripSiteNameSuffix(title, {
        siteName: altName,
      });
      if (alt !== title) {
        title = alt;
        break;
      }
    }
  }
  return title;
}

/** Keep `current` when it already has entries; otherwise use `candidateName` as a single-item list. */
function mergeAuthorName(current: string[] | null, candidateName: string | null | undefined): string[] | null {
  if (current && current.length > 0) return current;
  return candidateName ? [candidateName] : current;
}

/** Build the `/api/fetch-metadata` response for a non-YouTube URL (HTML scrape + oEmbed). */
async function buildGenericMetadataResult(
  url: string,
  siteNameHint: string | undefined,
): Promise<FetchMetadataResult> {
  const [html, {
    domain, website,
  }] = await Promise.all([
    fetchHeadHtml(url),
    lookupWebsiteByUrl(url),
  ]);
  let title = stripTitleSuffixes(html ? extractTitle(html) : null, {
    siteName: siteNameHint ?? website?.siteName,
    domain,
    alternateNames: website?.alternateNames,
  });
  let description = html ? extractDescription(html) : null;
  let authorNames = html ? extractAuthorNames(html) : null;
  const languageCode = html ? normalizeLanguageCode(extractLanguage(html)) : null;
  let thumbnailUrl: string | null = null;
  let datePosted: string | null = null;

  // Generalized oEmbed: clean, structured metadata for many media URLs (Vimeo, TikTok, Spotify, …)
  // with no API key — via a known-provider registry or `<link rel="oembed">` autodiscovery in the
  // head HTML we already fetched. oEmbed titles are already clean, so they win over the scraped
  // (suffix-stripped) title; oEmbed only *fills* a description/person the scrape didn't find.
  const oembed = await fetchOEmbedForUrl(url, html);
  if (oembed) {
    if (oembed.title) title = oembed.title;
    description ??= oembed.description;
    thumbnailUrl = oembed.thumbnailUrl;
    datePosted = oembed.datePosted;
    authorNames = mergeAuthorName(authorNames, oembed.authorName);
  }

  // Optional hosted provider (Tier 2, default off): handles JS-rendered / bot-protected pages the
  // direct scrape can't. When configured (env var or DB setting), its values win; when not, this
  // is a no-op (fetchHostedMetadata returns null) and behavior is identical to the direct scrape.
  const hosted = await fetchHostedMetadata(url);
  if (hosted) {
    title = hosted.title ?? title;
    description = hosted.description ?? description;
    thumbnailUrl = hosted.imageUrl ?? thumbnailUrl;
    datePosted = hosted.datePosted ?? datePosted;
    authorNames = mergeAuthorName(authorNames, hosted.authorName);
  }

  // Collect every candidate image (Instagram carousel / og / twitter / JSON-LD / article <img>),
  // ranking the resolved oEmbed/hosted thumbnail first. SSRF- and blacklist-filtered inside.
  const imageCandidates = await buildImageCandidates({
    url,
    headHtml: html,
    primaryUrl: thumbnailUrl,
    blacklist: await getImageUrlBlacklist(),
  });

  return {
    title,
    description,
    isYouTube: false,
    channel: null,
    durationSeconds: null,
    datePosted,
    // Keep the single thumbnail in sync with the best candidate so existing single-image consumers work.
    thumbnailUrl: imageCandidates[0]?.url ?? thumbnailUrl,
    imageCandidates,
    authorNames,
    languageCode,
  };
}

/**
 * Follow a URL's redirect chain to the `ResolveUrlResult` wire shape. Falls back to the original URL
 * with a user-facing `resolveError` on any non-ok outcome. Shared by `/api/resolve-url` and `/api/scan`.
 *
 * When HTTP fails (bot detection, 4xx/5xx), Browserless is tried as a fallback before returning an
 * error — it can navigate through JS challenges and follow `window.location` redirects that plain
 * HTTP HEAD/GET cannot.
 */
async function resolveRedirectResult(url: string): Promise<ResolveUrlResult> {
  const result = await unwrapRedirect(url);
  if (result.kind === "ok") {
    return {
      finalUrl: result.finalUrl,
      redirected: result.redirected,
    };
  }

  // HTTP failed — try Browserless before surfacing the error to the user.
  if (result.kind !== "blocked") {
    const browserlessUrl = await unwrapWithBrowserless(url);
    if (browserlessUrl) {
      return {
        finalUrl: browserlessUrl,
        redirected: true,
      };
    }
  }

  let resolveError: string;
  switch (result.kind) {
    case "blocked":
      resolveError = "That URL redirects to a private or restricted address and couldn't be followed.";
      break;
    case "timeout":
      resolveError = "The redirect timed out — the link may be slow or temporarily unavailable.";
      break;
    case "http_error":
      resolveError = `The redirect server returned HTTP ${result.status} — this link may be expired or one-time-use (common with email tracking links).`;
      break;
    case "network_error":
      resolveError = "Could not connect to follow this redirect. The server may be down or unreachable.";
      break;
  }
  return {
    finalUrl: url,
    redirected: false,
    resolveError,
  };
}

/** Map the `lookupWebsiteByUrl` service shape to the `WebsiteLookup` wire type. */
function toWebsiteLookup(raw: Awaited<ReturnType<typeof lookupWebsiteByUrl>>): WebsiteLookup {
  return {
    domain: raw.domain,
    exists: raw.website !== null,
    siteName: raw.website?.siteName ?? null,
    mediaTypeId: raw.website?.mediaTypeId ?? null,
    shortener: raw.shortener,
  };
}

/** Metadata helpers (page-title lookup), mounted under `/api`. */
export async function metadataRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/fetch-title", {
    schema: {
      tags: ["metadata"],
      querystring: fetchTitleQuery,
    },
  }, async (req, reply) => {
    const {
      url, siteName: siteNameHint,
    } = req.query as { url: string;
      siteName?: string; };
    if (!isValidUrl(url)) {
      throw new ValidationError("url must be a valid http(s) URL");
    }
    // YouTube watch pages rarely expose a parseable <title> before the </head> cutoff,
    // so use the same oEmbed lookup as /api/fetch-metadata before the strict HTML path.
    if (isYouTubeVideoUrl(url)) {
      const meta = await fetchYouTubeMetadata(url);
      // oEmbed titles are already clean (no site-name suffix to strip).
      if (meta?.title) {
        return {
          title: meta.title,
        };
      }
      // Fall through to the page-title fetch below if oEmbed had no title
      // (e.g. private/blocked video) — it can still 502 with a real reason.
    }
    const result = await fetchPageTitle(url);
    if (result.kind !== "ok") {
      let message: string;
      switch (result.kind) {
        case "timeout":
          message = "The request to that URL timed out. The site may be slow or unreachable.";
          break;
        case "http_error":
          message = `That URL returned an HTTP ${result.status} error and no title could be read.`;
          break;
        case "no_body":
          message = "The URL returned a response with no body — no title could be extracted.";
          break;
        case "no_title":
          message = "The page was fetched successfully but does not have a <title> tag.";
          break;
        case "network_error":
          message = "A network error occurred while trying to reach that URL.";
          break;
      }
      return reply.code(502).send({
        message,
        reason: result.kind,
      });
    }
    // Site names shouldn't be appended to autogenerated titles — strip a trailing
    // site-name/brand suffix (e.g. "Pricing · GitHub" → "Pricing").
    // A caller-supplied siteNameHint (for sites not yet in the DB) takes precedence.
    const {
      domain, website,
    } = await lookupWebsiteByUrl(url);
    let title = stripSiteNameSuffix(result.title, {
      siteName: siteNameHint ?? website?.siteName,
      domain,
    });
    if (title === result.title && website?.alternateNames && website.alternateNames.length > 0) {
      for (const altName of website.alternateNames) {
        const alt = stripSiteNameSuffix(title, {
          siteName: altName,
        });
        if (alt !== title) {
          title = alt;
          break;
        }
      }
    }
    return {
      title,
    };
  });

  // Lightweight reachability probe: does this URL still resolve? Never 502s — the client renders the
  // returned status/reason directly, so a dead link is a normal 200 result, not a request failure.
  app.get("/api/check-url", {
    schema: {
      tags: ["metadata"],
      querystring: fetchTitleQuery,
    },
  }, async (req) => {
    const {
      url,
    } = req.query as { url: string };
    if (!isValidUrl(url)) {
      throw new ValidationError("url must be a valid http(s) URL");
    }
    const result = await checkUrl(url);
    return {
      ok: result.kind === "ok",
      status: result.kind === "ok" || result.kind === "http_error" ? result.status : null,
      ...(result.kind !== "ok" && {
        reason: result.kind,
      }),
    };
  });

  // Follow a URL's redirect chain to its real destination. Returns the final URL (or the original on
  // any non-blocking failure — this is best-effort). Used by the bookmark form to resolve tracker
  // and click-redirect URLs before saving, mirroring the newsletter import pipeline's behavior.
  app.get("/api/resolve-url", {
    schema: {
      tags: ["metadata"],
      querystring: fetchTitleQuery,
    },
  }, async (req) => {
    const {
      url,
    } = req.query as { url: string };
    if (!isValidUrl(url)) {
      throw new ValidationError("url must be a valid http(s) URL");
    }
    // Falls back to the original URL on any failure (with a user-facing message); see resolveRedirectResult.
    return resolveRedirectResult(url);
  });

  // Look up book/product metadata from the Open Library API by ISBN or ASIN.
  app.get("/api/fetch-isbn-metadata", {
    schema: {
      tags: ["metadata"],
      querystring: {
        type: "object",
        required: ["isbn"],
        additionalProperties: false,
        properties: {
          isbn: {
            type: "string",
            minLength: 10,
          },
        },
      },
    },
  }, async (req, reply): Promise<FetchIsbnMetadataResult> => {
    const {
      isbn,
    } = req.query as { isbn: string };
    const outcome = await fetchIsbnMetadata(isbn);
    if (outcome.kind === "ok") return outcome.result;
    if (outcome.kind === "not_found") {
      return reply.code(404).send({
        message: "No book found for that ISBN in Open Library, Google Books, or your Kavita library. Check the ISBN and try again.",
        detail: outcome.debug,
      }) as unknown as FetchIsbnMetadataResult;
    }
    return reply.code(502).send({
      message: "Couldn't reach the book metadata providers. Check your connection and try again.",
      detail: outcome.debug,
    }) as unknown as FetchIsbnMetadataResult;
  });

  // Resolve a book-site product URL (Amazon or honto.jp) to an ISBN-13. For Amazon, the ASIN itself
  // is usually a valid ISBN-10 (pure, no fetch); when it isn't, or for honto.jp (which has no
  // ASIN-equivalent), fall back to reading the ISBN out of the product page's own structured
  // details. Best-effort like /api/scan — a page with no discoverable ISBN returns { isbn: null }.
  app.get("/api/isbn/from-book-url", {
    schema: {
      tags: ["metadata"],
      querystring: {
        type: "object",
        required: ["url"],
        additionalProperties: false,
        properties: {
          url: {
            type: "string",
          },
        },
      },
    },
  }, async (req): Promise<{ isbn: string | null }> => {
    const {
      url,
    } = req.query as { url: string };
    if (!isValidUrl(url)) {
      throw new ValidationError("url must be a valid http(s) URL");
    }
    if (isAmazonProductUrl(url)) {
      const isbnFromAsin = extractIsbn13FromAmazonUrl(url);
      const isbn = isbnFromAsin ?? await fetchAmazonIsbnFromPage(url);
      return {
        isbn,
      };
    }
    if (isHontoProductUrl(url)) {
      return {
        isbn: await fetchHontoIsbnFromPage(url),
      };
    }
    throw new ValidationError("url must be an Amazon or honto.jp product URL");
  });

  // Richer metadata lookup: title for any URL, plus channel/duration/thumbnail for YouTube videos.
  // Unlike /api/fetch-title this never 502s — a partial result (e.g. title-only) is still useful.
  app.get("/api/fetch-metadata", {
    schema: {
      tags: ["metadata"],
      querystring: fetchTitleQuery,
    },
  }, async (req): Promise<FetchMetadataResult> => {
    const {
      url, siteName: siteNameHint,
    } = req.query as { url: string;
      siteName?: string; };
    if (!isValidUrl(url)) {
      throw new ValidationError("url must be a valid http(s) URL");
    }

    return isYouTubeVideoUrl(url)
      ? buildYouTubeMetadataResult(url, req.log)
      : buildGenericMetadataResult(url, siteNameHint);
  });

  // Consolidated single-fetch scan: resolve redirects, then in parallel look up the website, check
  // for a duplicate bookmark, and fetch the page metadata once (title/description/image/people, plus
  // YouTube/oEmbed enrichment). Returns everything the Add Bookmark form needs in one round-trip,
  // replacing the separate resolve-url / websites-lookup / url-check / fetch-title / fetch-metadata
  // calls. Best-effort like /api/fetch-metadata — a partial result is still useful, never a 502.
  app.get("/api/scan", {
    schema: {
      tags: ["metadata"],
      querystring: scanQuery,
    },
  }, async (req): Promise<ScanResult> => {
    const {
      url, siteName: siteNameHint, resolveRedirect = true,
      isbn, plexRatingKey, kavitaSeriesId, feedUrl,
    } = req.query as { url: string;
      siteName?: string;
      resolveRedirect?: boolean;
      isbn?: string;
      plexRatingKey?: string;
      kavitaSeriesId?: number;
      feedUrl?: string; };
    if (!isValidUrl(url)) {
      throw new ValidationError("url must be a valid http(s) URL");
    }

    const identity = {
      isbn,
      plexRatingKey,
      kavitaSeriesId,
      feedUrl,
    };
    const hasIdentity = Object.values(identity).some(v => v != null);

    // Serve a recent identical scan from the short-TTL cache so re-scans / duplicate adds are instant.
    // Skipped when identity fields are supplied so a stale cached `duplicate` never masks a fresh
    // identity-based match.
    const cacheKey = scanCacheKey(url, siteNameHint, resolveRedirect);
    const cached = hasIdentity ? null : getCachedScan(cacheKey);
    if (cached) return cached;

    // The client gates redirect resolution on its redirect-ignore list, mirroring the old flow.
    const redirect = resolveRedirect
      ? await resolveRedirectResult(url)
      : {
        finalUrl: url,
        redirected: false,
      };
    const finalUrl = redirect.finalUrl;

    // The ASIN itself is usually a valid ISBN-10 (pure, no fetch); when it isn't, fall back to
    // reading the ISBN straight out of the product page's own structured details. honto.jp has no
    // ASIN-equivalent, so it always needs the page fetch.
    const isbnFromAsin = extractIsbn13FromAmazonUrl(finalUrl);
    const [websiteRaw, duplicate, metadata, isbnFromAmazonPage, isbnFromHontoPage] = await Promise.all([
      lookupWebsiteByUrl(finalUrl),
      checkBookmarkUrlDuplicate(finalUrl, identity),
      isYouTubeVideoUrl(finalUrl)
        ? buildYouTubeMetadataResult(finalUrl, req.log)
        : buildGenericMetadataResult(finalUrl, siteNameHint),
      isbnFromAsin === null && isAmazonProductUrl(finalUrl)
        ? fetchAmazonIsbnFromPage(finalUrl)
        : Promise.resolve(null),
      isHontoProductUrl(finalUrl)
        ? fetchHontoIsbnFromPage(finalUrl)
        : Promise.resolve(null),
    ]);

    const website = toWebsiteLookup(websiteRaw);
    const result: ScanResult = {
      finalUrl,
      redirected: redirect.redirected,
      ...(redirect.resolveError !== undefined && {
        resolveError: redirect.resolveError,
      }),
      website,
      duplicate,
      title: metadata.title,
      description: metadata.description,
      isYouTube: metadata.isYouTube,
      channel: metadata.channel,
      durationSeconds: metadata.durationSeconds,
      datePosted: metadata.datePosted,
      thumbnailUrl: metadata.thumbnailUrl,
      imageCandidates: metadata.imageCandidates,
      authorNames: metadata.authorNames,
      languageCode: metadata.languageCode,
      // The social account `finalUrl` points at, if any (pure of `finalUrl`, so cache-safe).
      socialAccount: socialAccountFromUrl(finalUrl),
      // A checksum-valid ISBN-13 from an Amazon product URL's ASIN, or (when the ASIN itself isn't
      // one, or the URL is a honto.jp product page) scraped from the product page's own structured
      // details.
      isbn: isbnFromAsin ?? isbnFromAmazonPage ?? isbnFromHontoPage,
      // An instant icon for display via the DuckDuckGo icon service (no scrape, no object storage).
      faviconUrl: website.domain ? duckDuckGoIconUrl(website.domain) : null,
      ...(metadata.diagnostics !== undefined && {
        diagnostics: metadata.diagnostics,
      }),
    };
    if (!hasIdentity) setCachedScan(cacheKey, result);
    return result;
  });
}
