/**
 * Keyless podcast metadata connector. A Podcast's fields (title/author/artwork/description/language)
 * are resolved from either the **Apple Podcasts (iTunes) Search & Lookup API** (JSON, no key), the
 * **Pocket Casts** public search API (JSON, no key — the same endpoint its web player uses; unofficial,
 * so all calls fail soft to `[]`/`null` if it changes), or a pasted **RSS/XML feed URL** (parsed with
 * `fast-xml-parser`). A podcast's page URL on each service is cross-resolved by matching its RSS feed
 * across the directories (`resolvePodcastProviderLinks`); Spotify has no keyless search, so its link is
 * manual-paste only and never cross-resolved. Powers the create/edit search picker, the resolve-only
 * `GET /api/podcasts/:id/{feed-preview,resolve-links}` behind the "Sync from source" modal + "Find on
 * all services", and the artwork import. Every off-box image/URL passes `isPublicHttpUrl` before fetch.
 * Display/metadata only — never touches `invalidateBookmarkCache()`.
 */

import { XMLParser } from "fast-xml-parser";
import type { PodcastFeedResult, PodcastProviderLinks, PodcastSearchResult } from "@eesimple/types";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { podcasts } from "@/db/schema";
import { downloadImage, isPublicHttpUrl } from "@/services/metadata";
import { addTaxonomyImage, type AddTaxonomyImageResult } from "@/services/taxonomyImages";
import { normalizeLanguageCode } from "@/utils/languageCodes";

const ITUNES_SEARCH = "https://itunes.apple.com/search";
const ITUNES_LOOKUP = "https://itunes.apple.com/lookup";
/** The public Pocket Casts search endpoint (unofficial — same one the web player uses). */
const POCKET_CASTS_SEARCH = "https://podcast-api.pocketcasts.com/search";
const FETCH_TIMEOUT_MS = 8000;
/** Cap the feed body we read so a huge response can't exhaust memory. */
const MAX_FEED_BYTES = 4 * 1024 * 1024;
const USER_AGENT = "eeSimple-bookmarks/1.0 (podcast taxonomy metadata)";

/** Fetch + parse JSON with a timeout and a descriptive User-Agent; `null` on any failure. */
async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  }
  catch {
    return null;
  }
  finally {
    clearTimeout(timer);
  }
}

/** POST a JSON body and parse the JSON response with a timeout + descriptive UA; `null` on any failure. */
async function fetchJsonPost(url: string, body: unknown): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  }
  catch {
    return null;
  }
  finally {
    clearTimeout(timer);
  }
}

/** Fetch a feed URL's text body (bounded + timed out); `null` on any failure or oversized body. */
async function fetchFeedText(feedUrl: string): Promise<string | null> {
  if (!isPublicHttpUrl(feedUrl)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      signal: controller.signal,
    });
    if (!response.ok || !response.body) return null;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const {
        done, value,
      } = await reader.read();
      if (done) break;
      if (value) {
        total += value.length;
        if (total > MAX_FEED_BYTES) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }
    return Buffer.concat(chunks.map(c => Buffer.from(c))).toString("utf8");
  }
  catch {
    return null;
  }
  finally {
    clearTimeout(timer);
  }
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // Podcast feeds carry a single <channel>; never coerce it to an array.
  isArray: () => false,
});

/** A trimmed non-empty string, else `null`. */
function str(value: unknown): string | null {
  if (typeof value === "string") return value.trim() === "" ? null : value.trim();
  if (typeof value === "number") return String(value);
  return null;
}

/**
 * Pull the `#text` out of a value that fast-xml-parser may have modeled as a string or as an
 * `{ "#text": …, "@_…": … }` object (e.g. `<description>` with attributes).
 */
function textOf(value: unknown): string | null {
  if (value && typeof value === "object" && "#text" in value) {
    return str((value as Record<string, unknown>)["#text"]);
  }
  return str(value);
}

/** Read an image URL from an `<itunes:image href>` attr, or a nested `<image><url>`. */
function imageUrlOf(channel: Record<string, unknown>): string | null {
  const itunesImage = channel["itunes:image"];
  if (itunesImage && typeof itunesImage === "object") {
    const href = str((itunesImage as Record<string, unknown>)["@_href"]);
    if (href) return href;
  }
  const image = channel.image;
  if (image && typeof image === "object") {
    const url = str((image as Record<string, unknown>).url);
    if (url) return url;
  }
  return str(itunesImage);
}

/** Parse an RSS/XML feed body into normalized podcast metadata. Returns `null` when unreadable. */
export function parsePodcastFeed(xml: string): Omit<PodcastFeedResult, "feedUrl" | "itunesId" | "itunesUrl"> | null {
  let parsed: unknown;
  try {
    parsed = xmlParser.parse(xml) as unknown;
  }
  catch {
    return null;
  }
  const rss = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>).rss : null;
  const channelRaw = rss && typeof rss === "object" ? (rss as Record<string, unknown>).channel : null;
  if (!channelRaw || typeof channelRaw !== "object") return null;
  const channel = channelRaw as Record<string, unknown>;

  const imageUrl = imageUrlOf(channel);
  return {
    title: str(channel.title),
    author: str(channel["itunes:author"]) ?? str(channel.managingEditor),
    description: textOf(channel.description) ?? textOf(channel["itunes:summary"]),
    imageUrl: imageUrl && isPublicHttpUrl(imageUrl) ? imageUrl : null,
    languageCode: normalizeLanguageCode(str(channel.language)),
  };
}

interface ItunesResult {
  collectionId?: unknown;
  collectionName?: unknown;
  trackName?: unknown;
  artistName?: unknown;
  feedUrl?: unknown;
  collectionViewUrl?: unknown;
  trackViewUrl?: unknown;
  artworkUrl600?: unknown;
  artworkUrl100?: unknown;
}

function toSearchResult(r: ItunesResult): PodcastSearchResult | null {
  const itunesId = typeof r.collectionId === "number" ? r.collectionId : null;
  const name = str(r.collectionName) ?? str(r.trackName);
  if (itunesId == null || !name) return null;
  return {
    provider: "itunes",
    itunesId,
    pocketCastsUuid: null,
    name,
    author: str(r.artistName),
    feedUrl: str(r.feedUrl),
    itunesUrl: str(r.collectionViewUrl) ?? str(r.trackViewUrl),
    pocketCastsUrl: null,
    artworkUrl: str(r.artworkUrl600) ?? str(r.artworkUrl100),
  };
}

/** Search Apple Podcasts (iTunes) by term. Keyless; returns [] on any failure. */
export async function searchPodcasts(term: string): Promise<PodcastSearchResult[]> {
  const q = term.trim();
  if (q.length === 0) return [];
  const url = `${ITUNES_SEARCH}?media=podcast&limit=25&term=${encodeURIComponent(q)}`;
  const json = await fetchJson(url);
  const results = json && typeof json === "object" ? (json as { results?: unknown }).results : null;
  if (!Array.isArray(results)) return [];
  return results
    .map(r => toSearchResult(r as ItunesResult))
    .filter((r): r is PodcastSearchResult => r !== null);
}

interface PocketCastsResult {
  uuid?: unknown;
  title?: unknown;
  author?: unknown;
  url?: unknown;
}

/** Build the public Pocket Casts share page URL for a podcast uuid. */
function pocketCastsUrl(uuid: string): string {
  return `https://pca.st/podcast/${uuid}`;
}

function toPocketCastsResult(r: PocketCastsResult): PodcastSearchResult | null {
  const uuid = str(r.uuid);
  const name = str(r.title);
  if (!uuid || !name) return null;
  return {
    provider: "pocketCasts",
    itunesId: null,
    pocketCastsUuid: uuid,
    name,
    author: str(r.author),
    feedUrl: str(r.url),
    itunesUrl: null,
    pocketCastsUrl: pocketCastsUrl(uuid),
    artworkUrl: null,
  };
}

/** Search Pocket Casts by term (keyless, unofficial). Returns [] on any failure. */
export async function searchPodcastsPocketCasts(term: string): Promise<PodcastSearchResult[]> {
  const q = term.trim();
  if (q.length === 0) return [];
  const json = await fetchJsonPost(POCKET_CASTS_SEARCH, {
    q,
  });
  const podcastsList = json && typeof json === "object" ? (json as { podcasts?: unknown }).podcasts : null;
  if (!Array.isArray(podcastsList)) return [];
  return podcastsList
    .map(r => toPocketCastsResult(r as PocketCastsResult))
    .filter((r): r is PodcastSearchResult => r !== null);
}

/** Normalize a feed URL for equality matching (lowercase host/scheme, drop a trailing slash). */
function normalizeFeedUrl(url: string): string {
  return url.trim().toLowerCase().replace(/\/+$/, "");
}

/**
 * Cross-resolve a podcast's page URL on each keyless directory by matching its RSS feed URL. Searches
 * Apple + Pocket Casts by name and keeps the hit whose feed URL matches. Best-effort — every field is
 * nullable; Spotify is never resolved (no keyless lookup).
 */
export async function resolvePodcastProviderLinks(
  name: string,
  feedUrl: string,
): Promise<PodcastProviderLinks> {
  const target = normalizeFeedUrl(feedUrl);
  const empty: PodcastProviderLinks = {
    itunesId: null,
    itunesUrl: null,
    pocketCastsUuid: null,
    pocketCastsUrl: null,
  };
  if (!name.trim() || !target) return empty;

  const [itunesHits, pocketCastsHits] = await Promise.all([
    searchPodcasts(name),
    searchPodcastsPocketCasts(name),
  ]);
  const itunesMatch = itunesHits.find(r => r.feedUrl != null && normalizeFeedUrl(r.feedUrl) === target);
  const pocketMatch = pocketCastsHits.find(r => r.feedUrl != null && normalizeFeedUrl(r.feedUrl) === target);
  return {
    itunesId: itunesMatch?.itunesId ?? null,
    itunesUrl: itunesMatch?.itunesUrl ?? null,
    pocketCastsUuid: pocketMatch?.pocketCastsUuid ?? null,
    pocketCastsUrl: pocketMatch?.pocketCastsUrl ?? null,
  };
}

/** Resolve a single Apple Podcasts entry by collection id. Keyless; `null` on any failure. */
export async function lookupPodcastByItunesId(id: number): Promise<PodcastSearchResult | null> {
  const json = await fetchJson(`${ITUNES_LOOKUP}?id=${encodeURIComponent(String(id))}`);
  const results = json && typeof json === "object" ? (json as { results?: unknown }).results : null;
  if (!Array.isArray(results) || results.length === 0) return null;
  return toSearchResult(results[0] as ItunesResult);
}

/** Fetch + parse a feed URL into a full `PodcastFeedResult`. `null` when the feed can't be read. */
export async function resolvePodcastFeed(feedUrl: string): Promise<PodcastFeedResult | null> {
  const xml = await fetchFeedText(feedUrl);
  if (!xml) return null;
  const parsed = parsePodcastFeed(xml);
  if (!parsed) return null;
  return {
    ...parsed,
    feedUrl,
    itunesId: null,
    itunesUrl: null,
  };
}

/**
 * Extract the numeric collection id from an Apple/Apple-Podcasts show page URL
 * (`https://podcasts.apple.com/us/podcast/<slug>/id<digits>`). `null` for any other host, an
 * unparsable URL, or a path with no trailing `id<digits>` segment.
 */
export function extractApplePodcastsId(url: string): number | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  }
  catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  if (host !== "podcasts.apple.com" && host !== "itunes.apple.com") return null;
  const match = /id(\d+)(?:[/?#]|$)/.exec(parsed.pathname);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) ? id : null;
}

/**
 * Resolve a pasted podcast URL for the search picker — an Apple Podcasts show page (via its
 * collection id) or a raw RSS/XML feed URL. Keyless; `null` when the URL doesn't resolve to a
 * podcast either way.
 */
export async function resolvePodcastByUrl(url: string): Promise<PodcastSearchResult | null> {
  const appleId = extractApplePodcastsId(url);
  if (appleId != null) {
    const result = await lookupPodcastByItunesId(appleId);
    if (result) return result;
  }
  const feed = await resolvePodcastFeed(url);
  if (!feed) return null;
  return {
    provider: "feed",
    itunesId: null,
    pocketCastsUuid: null,
    name: feed.title ?? url,
    author: feed.author,
    feedUrl: url,
    itunesUrl: null,
    pocketCastsUrl: null,
    artworkUrl: feed.imageUrl,
  };
}

/**
 * Resolve the current metadata for a stored podcast, for the "Sync from source" preview. Prefers the
 * stored `feedUrl`; when only an `itunesId` is stored, resolves the feed via the iTunes lookup first.
 * Returns `null` when the podcast has no usable source or the source can't be read.
 */
export async function resolvePodcastFeedPreview(podcastId: string): Promise<PodcastFeedResult | null> {
  const [row] = await db.select({
    feedUrl: podcasts.feedUrl,
    itunesId: podcasts.itunesId,
    itunesUrl: podcasts.itunesUrl,
  }).from(podcasts).where(eq(podcasts.id, podcastId));
  if (!row) return null;

  let feedUrl = row.feedUrl ?? null;
  let itunesUrl = row.itunesUrl ?? null;
  const itunesId = row.itunesId ?? null;
  if (!feedUrl && itunesId != null) {
    const looked = await lookupPodcastByItunesId(itunesId);
    feedUrl = looked?.feedUrl ?? null;
    itunesUrl = itunesUrl ?? looked?.itunesUrl ?? null;
  }
  if (!feedUrl) return null;

  const resolved = await resolvePodcastFeed(feedUrl);
  if (!resolved) return null;
  const providerLinks = await resolvePodcastProviderLinks(resolved.title ?? "", feedUrl);
  return {
    ...resolved,
    itunesId: itunesId ?? providerLinks.itunesId,
    itunesUrl: itunesUrl ?? providerLinks.itunesUrl,
    providerLinks,
  };
}

/** Why a podcast artwork import failed, beyond `addTaxonomyImage`'s own outcomes. */
export type PodcastArtworkImportResult
  = | AddTaxonomyImageResult
    | "not_found"
    | "no_source"
    | "artwork_unavailable";

/**
 * Resolve the podcast's artwork URL (feed `itunes:image`, else the iTunes lookup artwork), download it,
 * and store it as the podcast's main image. Mirrors `importIsbnCoverForBook`.
 */
export async function importPodcastArtwork(podcastId: string): Promise<PodcastArtworkImportResult> {
  const [row] = await db.select({
    feedUrl: podcasts.feedUrl,
    itunesId: podcasts.itunesId,
  }).from(podcasts).where(eq(podcasts.id, podcastId));
  if (!row) return "not_found";

  let artworkUrl: string | null = null;
  if (row.feedUrl) {
    const resolved = await resolvePodcastFeed(row.feedUrl);
    artworkUrl = resolved?.imageUrl ?? null;
  }
  if (!artworkUrl && row.itunesId != null) {
    const looked = await lookupPodcastByItunesId(row.itunesId);
    artworkUrl = looked?.artworkUrl ?? null;
  }
  if (!artworkUrl && !row.feedUrl && row.itunesId == null) return "no_source";
  if (!artworkUrl || !isPublicHttpUrl(artworkUrl)) return "artwork_unavailable";

  const bytes = await downloadImage(artworkUrl);
  if (!bytes) return "artwork_unavailable";
  return addTaxonomyImage("podcast", podcastId, bytes, "podcast", {
    setMain: true,
  });
}
