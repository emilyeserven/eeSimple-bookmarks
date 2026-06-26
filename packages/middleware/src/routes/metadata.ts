import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import type { FetchIsbnMetadataResult, FetchMetadataResult } from "@eesimple/types";
import {
  checkUrl,
  extractAuthorNames,
  extractDescription,
  extractTitle,
  fetchHeadHtml,
  fetchPageTitle,
} from "@/services/metadata";
import { fetchOEmbedForUrl } from "@/services/oembed";
import { unwrapRedirect } from "@/services/redirectUnwrap";
import { lookupWebsiteByUrl, stripSiteNameSuffix } from "@/services/websites";
import { fetchYouTubeMetadata, isYouTubeVideoUrl } from "@/services/youtube";
import { channelKeyFromUrl, getYouTubeChannelByKey } from "@/services/youtubeChannels";
import { isValidUrl } from "@/utils/url";

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
  // oEmbed titles are already clean; fall back to a page-title fetch if it was unavailable.
  let title = meta?.title ?? null;
  if (title === null) {
    const fallback = await fetchPageTitle(url);
    if (fallback.kind === "ok") title = fallback.title;
  }

  const channelKey = meta?.channelUrl ? channelKeyFromUrl(meta.channelUrl) : null;
  const existingChannel = channelKey ? await getYouTubeChannelByKey(channelKey) : null;
  const selfIds = existingChannel?.selfIds ?? [];

  // Strip channel self-identifier suffix from the title (e.g. " - SNL" from an SNL video).
  if (title && selfIds.length > 0) {
    for (const selfId of selfIds) {
      const stripped = stripSiteNameSuffix(title, {
        siteName: selfId,
      });
      if (stripped !== title) {
        title = stripped;
        break;
      }
    }
  }

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
    thumbnailUrl: meta?.thumbnailUrl ?? null,
    authorNames: null,
    ...(warnings.length > 0 && {
      diagnostics: warnings,
    }),
  };
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
  const rawTitle = html ? extractTitle(html) : null;
  let title = rawTitle
    ? stripSiteNameSuffix(rawTitle, {
      siteName: siteNameHint ?? website?.siteName,
      domain,
    })
    : null;
  if (title && title === rawTitle && website?.alternateNames && website.alternateNames.length > 0) {
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

  let description = html ? extractDescription(html) : null;
  let authorNames = html ? extractAuthorNames(html) : null;
  let thumbnailUrl: string | null = null;
  let datePosted: string | null = null;

  // Generalized oEmbed: clean, structured metadata for many media URLs (Vimeo, TikTok, Spotify, …)
  // with no API key — via a known-provider registry or `<link rel="oembed">` autodiscovery in the
  // head HTML we already fetched. oEmbed titles are already clean, so they win over the scraped
  // (suffix-stripped) title; oEmbed only *fills* a description/author the scrape didn't find.
  const oembed = await fetchOEmbedForUrl(url, html);
  if (oembed) {
    if (oembed.title) title = oembed.title;
    description ??= oembed.description;
    thumbnailUrl = oembed.thumbnailUrl;
    datePosted = oembed.datePosted;
    if ((!authorNames || authorNames.length === 0) && oembed.authorName) {
      authorNames = [oembed.authorName];
    }
  }

  return {
    title,
    description,
    isYouTube: false,
    channel: null,
    durationSeconds: null,
    datePosted,
    thumbnailUrl,
    authorNames,
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
      return reply.code(400).send({
        message: "url must be a valid http(s) URL",
      });
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
  }, async (req, reply) => {
    const {
      url,
    } = req.query as { url: string };
    if (!isValidUrl(url)) {
      return reply.code(400).send({
        message: "url must be a valid http(s) URL",
      });
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
  }, async (req, reply) => {
    const {
      url,
    } = req.query as { url: string };
    if (!isValidUrl(url)) {
      return reply.code(400).send({
        message: "url must be a valid http(s) URL",
      });
    }
    const result = await unwrapRedirect(url);
    if (result.kind === "ok") {
      return {
        finalUrl: result.finalUrl,
        redirected: result.redirected,
      };
    }
    // Any failure — fall back to the original URL so the form keeps working, but surface a
    // user-facing message so the client can tell the user why the redirect wasn't followed.
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
    const apiUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`;
    let rawJson: Record<string, unknown>;
    try {
      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent": "eeSimple-bookmarks/1.0",
        },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        return reply.code(502).send({
          message: "Couldn't reach Open Library. Check your connection and try again.",
        }) as unknown as FetchIsbnMetadataResult;
      }
      rawJson = (await response.json()) as Record<string, unknown>;
    }
    catch {
      return reply.code(502).send({
        message: "Couldn't reach Open Library. Check your connection and try again.",
      }) as unknown as FetchIsbnMetadataResult;
    }

    const key = `ISBN:${isbn}`;
    const data = rawJson[key] as Record<string, unknown> | undefined;
    if (!data) {
      return reply.code(404).send({
        message: "No book found for that ISBN in Open Library. Check the ISBN and try again.",
      }) as unknown as FetchIsbnMetadataResult;
    }

    const descRaw = data.description as { value?: string } | string | undefined;
    const description = typeof descRaw === "string"
      ? descRaw
      : typeof descRaw === "object" && descRaw !== null
        ? (descRaw.value ?? null)
        : null;

    const coversRaw = data.cover as { large?: string;
      medium?: string; } | undefined;
    const authorsRaw = data.authors as { name?: string }[] | undefined;
    const publishersRaw = data.publishers as { name?: string }[] | undefined;

    return {
      title: typeof data.title === "string" ? data.title : null,
      description: description as string | null,
      coverUrl: coversRaw?.large ?? coversRaw?.medium ?? null,
      authors: authorsRaw?.map(a => a.name ?? "").filter(Boolean) ?? [],
      publisher: publishersRaw?.[0]?.name ?? null,
      year: typeof data.publish_date === "string" ? data.publish_date : null,
      openLibraryUrl: typeof data.url === "string" ? data.url : null,
    };
  });

  // Richer metadata lookup: title for any URL, plus channel/duration/thumbnail for YouTube videos.
  // Unlike /api/fetch-title this never 502s — a partial result (e.g. title-only) is still useful.
  app.get("/api/fetch-metadata", {
    schema: {
      tags: ["metadata"],
      querystring: fetchTitleQuery,
    },
  }, async (req, reply): Promise<FetchMetadataResult> => {
    const {
      url, siteName: siteNameHint,
    } = req.query as { url: string;
      siteName?: string; };
    if (!isValidUrl(url)) {
      return reply.code(400).send({
        message: "url must be a valid http(s) URL",
      }) as unknown as FetchMetadataResult;
    }

    return isYouTubeVideoUrl(url)
      ? buildYouTubeMetadataResult(url, req.log)
      : buildGenericMetadataResult(url, siteNameHint);
  });
}
