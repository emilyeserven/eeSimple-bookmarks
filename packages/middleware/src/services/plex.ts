/**
 * Optional Plex connector (Tier 2, DEFAULT OFF). When an operator configures a base URL and an
 * `X-Plex-Token` (Settings → Connectors, or the `PLEX_ENDPOINT` / `PLEX_TOKEN` env vars), bookmarks
 * can be linked to an item on the Plex media server (movie, TV show, music, …): the middleware
 * proxies item searches and poster fetches so the token never reaches the client.
 *
 * The endpoint is operator-configured and typically points at a LAN/localhost instance, so it is
 * deliberately NOT `isPublicHttpUrl`-guarded — the same trust model as `kavitaEndpoint` and
 * `archiveBoxEndpoint`. Nothing leaves the box unless the operator opts in.
 *
 * Auth is a static `X-Plex-Token` header (no session exchange, unlike Kavita's plugin JWT). The
 * token is also appended as a query param when fetching poster image bytes, whose URL is derived
 * from the item's own metadata — never a client value.
 */

import type { PlexItemResult, TaxonomyImageOwnerType } from "@eesimple/types";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { albums, artists, bookmarks, episodes, movies, tracks, tvShows } from "@/db/schema";
import { updateAlbum } from "@/services/albums";
import { getActivePlexEndpoint, getDecryptedPlexToken } from "@/services/appSettings";
import { updateArtist } from "@/services/artists";
import { addBookmarkImage } from "@/services/bookmarkImages";
import { updateEpisode } from "@/services/episodes";
import { resolveBookmarkPlexRatingKey, updateMovie } from "@/services/movies";
import { addTaxonomyImage, type AddTaxonomyImageResult } from "@/services/taxonomyImages";
import { updateTrack } from "@/services/tracks";
import { updateTvShow } from "@/services/tvShows";
import { resolveTitleWikidata, type WikidataExternalId } from "@/services/wikidataTitle";
import { isObjectStoreConfigured } from "@/utils/objectStore";

const PLEX_TIMEOUT_MS = 10000;
// /identity is polled indirectly by the frequently-called /api/connectors endpoint; keep it snappy
// so an unreachable Plex server doesn't stall that response.
const PLEX_IDENTITY_TIMEOUT_MS = 5000;
// The Plex item types worth linking a bookmark to (search surfaces collections/clips/playlists too).
const LINKABLE_TYPES = new Set(["movie", "show", "season", "episode", "artist", "album", "track"]);

/** A `kind` filter narrows the search to a single family of Plex item types. */
export type PlexSearchKind = "movie" | "show" | "episode" | "album" | "artist" | "track";
const KIND_TYPES: Record<PlexSearchKind, ReadonlySet<string>> = {
  movie: new Set(["movie"]),
  show: new Set(["show"]),
  episode: new Set(["episode"]),
  album: new Set(["album"]),
  artist: new Set(["artist"]),
  track: new Set(["track"]),
};

let cachedMachineId: string | null = null;
let cachedForConfig: string | null = null;

/** Drop the cached machineIdentifier (tests, or after a config change). */
export function resetPlexCache(): void {
  cachedMachineId = null;
  cachedForConfig = null;
}

/** Whether a Plex server is configured — both base URL and token resolve (DB first, then env). */
export async function plexEnabledAsync(): Promise<boolean> {
  return Boolean(await getActivePlexEndpoint()) && Boolean(await getDecryptedPlexToken());
}

interface PlexConfig {
  baseUrl: string;
  token: string;
}

async function resolveConfig(): Promise<PlexConfig | null> {
  const endpoint = await getActivePlexEndpoint();
  const token = await getDecryptedPlexToken();
  if (!endpoint || !token) return null;
  return {
    baseUrl: endpoint.replace(/\/$/, ""),
    token,
  };
}

/**
 * GET a Plex API path (e.g. `/hubs/search?query=...`) with the `X-Plex-Token` header and a JSON
 * `Accept` (Plex defaults to XML). Returns `null` when unconfigured or the request errors.
 */
async function plexFetch(path: string, timeoutMs = PLEX_TIMEOUT_MS): Promise<Response | null> {
  const config = await resolveConfig();
  if (!config) return null;
  try {
    return await fetch(`${config.baseUrl}${path}`, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "Accept": "application/json",
        "X-Plex-Token": config.token,
      },
    });
  }
  catch {
    return null;
  }
}

/**
 * The server's `machineIdentifier`, needed to build web-UI deep links. Read from `/identity` and
 * cached per endpoint+token (only successful reads are cached; a failure retries next call).
 * Returns `null` when unconfigured or the server is unreachable.
 */
export async function getPlexMachineIdentifier(): Promise<string | null> {
  const config = await resolveConfig();
  if (!config) return null;
  const configKey = `${config.baseUrl} ${config.token}`;
  if (cachedMachineId && cachedForConfig === configKey) return cachedMachineId;
  const res = await plexFetch("/identity", PLEX_IDENTITY_TIMEOUT_MS);
  if (!res?.ok) return null;
  try {
    const body = (await res.json()) as { MediaContainer?: { machineIdentifier?: unknown } };
    const id = body.MediaContainer?.machineIdentifier;
    if (typeof id === "string" && id) {
      cachedMachineId = id;
      cachedForConfig = configKey;
      return id;
    }
  }
  catch {
    // Fall through to null.
  }
  return null;
}

/** Shape of one item in a Plex search hub (`Metadata` entries). */
interface PlexMetadata {
  ratingKey?: unknown;
  type?: unknown;
  title?: unknown;
  year?: unknown;
  thumb?: unknown;
  librarySectionTitle?: unknown;
  grandparentTitle?: unknown;
  grandparentRatingKey?: unknown;
  parentTitle?: unknown;
  parentRatingKey?: unknown;
  // External-ID references (populated on the full `/library/metadata` item, not the search hub).
  Guid?: { id?: unknown }[];
  guid?: unknown;
}

function grandparentTitleOf(raw: PlexMetadata): string | null {
  return typeof raw.grandparentTitle === "string" && raw.grandparentTitle ? raw.grandparentTitle : null;
}

/** A parent/grandparent ratingKey (Plex returns these as numeric or string), or `null`. */
function ratingKeyOf(value: unknown): string | null {
  if (typeof value === "number") return String(value);
  return typeof value === "string" && value ? value : null;
}

function parentTitleOf(raw: PlexMetadata): string | null {
  return typeof raw.parentTitle === "string" && raw.parentTitle ? raw.parentTitle : null;
}

function librarySectionTitleOf(raw: PlexMetadata): string | null {
  return typeof raw.librarySectionTitle === "string" && raw.librarySectionTitle
    ? raw.librarySectionTitle
    : null;
}

/** Compose a one-line context subtitle: show/artist · year · library. */
function composeSubtitle(raw: PlexMetadata): string | null {
  const year = typeof raw.year === "number" && raw.year > 0 ? String(raw.year) : null;
  const parts = [grandparentTitleOf(raw), year, librarySectionTitleOf(raw)].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function toItemResult(raw: PlexMetadata): PlexItemResult | null {
  // Plex ratingKeys come back as numeric strings; accept either representation.
  const ratingKey = typeof raw.ratingKey === "number"
    ? String(raw.ratingKey)
    : typeof raw.ratingKey === "string" && raw.ratingKey ? raw.ratingKey : null;
  if (!ratingKey) return null;
  if (typeof raw.type !== "string" || !LINKABLE_TYPES.has(raw.type)) return null;
  if (typeof raw.title !== "string" || !raw.title) return null;
  const librarySectionTitle = librarySectionTitleOf(raw);
  return {
    ratingKey,
    type: raw.type,
    title: raw.title,
    year: typeof raw.year === "number" && raw.year > 0 ? raw.year : null,
    librarySectionTitle,
    subtitle: composeSubtitle(raw),
    groupTitle: grandparentTitleOf(raw) ?? librarySectionTitle,
    parentTitle: parentTitleOf(raw),
    parentRatingKey: ratingKeyOf(raw.parentRatingKey),
    grandparentTitle: grandparentTitleOf(raw),
    grandparentRatingKey: ratingKeyOf(raw.grandparentRatingKey),
  };
}

/** Flatten the search response into a metadata list, tolerating both hub-grouped and flat shapes. */
function collectMetadata(container: unknown): PlexMetadata[] {
  if (typeof container !== "object" || container === null) return [];
  const mc = (container as { MediaContainer?: unknown }).MediaContainer;
  if (typeof mc !== "object" || mc === null) return [];
  const hubs = (mc as { Hub?: unknown }).Hub;
  if (Array.isArray(hubs)) {
    return hubs.flatMap((hub) => {
      const items = (hub as { Metadata?: unknown }).Metadata;
      return Array.isArray(items) ? (items as PlexMetadata[]) : [];
    });
  }
  const flat = (mc as { Metadata?: unknown }).Metadata;
  return Array.isArray(flat) ? (flat as PlexMetadata[]) : [];
}

/**
 * Search the Plex server for items matching `query` across all libraries. An optional `kind` narrows
 * the results to movies or TV shows (used by the Movies / TV Shows taxonomy lookups). Returns `[]`
 * when the connector is unconfigured or any step fails. Never throws.
 */
export async function searchPlexItems(
  query: string,
  kind?: PlexSearchKind,
): Promise<PlexItemResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const res = await plexFetch(`/hubs/search?query=${encodeURIComponent(trimmed)}&limit=30`);
  if (!res?.ok) return [];
  try {
    const items = collectMetadata(await res.json());
    const allowedTypes = kind ? KIND_TYPES[kind] : null;
    return items
      .map(toItemResult)
      .filter((entry): entry is PlexItemResult => entry !== null)
      .filter(entry => allowedTypes === null || allowedTypes.has(entry.type));
  }
  catch {
    return [];
  }
}

/** External IDs (IMDb / TMDb / TVDB / MusicBrainz) parsed from a Plex item's `Guid` array. */
export interface PlexGuids {
  imdb: string | null;
  tmdb: string | null;
  tvdb: string | null;
  musicBrainz: string | null;
}

const EMPTY_GUIDS: PlexGuids = {
  imdb: null,
  tmdb: null,
  tvdb: null,
  musicBrainz: null,
};

interface PlexItemMeta {
  thumb: string | null;
  guids: PlexGuids;
}

/**
 * Parse a Plex item's `Guid` array (plus the legacy top-level `guid`) into external IDs, e.g.
 * `imdb://tt6751668` → `{ imdb: "tt6751668" }` and `mbid://<uuid>` → `{ musicBrainz: "<uuid>" }`.
 */
function parseGuids(raw: PlexMetadata): PlexGuids {
  const guids: PlexGuids = {
    ...EMPTY_GUIDS,
  };
  const values: string[] = [];
  if (Array.isArray(raw.Guid)) {
    for (const entry of raw.Guid) {
      const id = entry?.id;
      if (typeof id === "string" && id) values.push(id);
    }
  }
  if (typeof raw.guid === "string" && raw.guid) values.push(raw.guid);
  for (const value of values) {
    const sep = value.indexOf("://");
    if (sep === -1) continue;
    const scheme = value.slice(0, sep);
    const id = value.slice(sep + 3).split("?")[0];
    if (!id) continue;
    if (scheme === "imdb" && !guids.imdb) guids.imdb = id;
    else if (scheme === "tmdb" && !guids.tmdb) guids.tmdb = id;
    else if (scheme === "tvdb" && !guids.tvdb) guids.tvdb = id;
    else if (scheme === "mbid" && !guids.musicBrainz) guids.musicBrainz = id;
  }
  return guids;
}

/** Fetch a Plex item's metadata (poster `thumb` path + external IDs) in one `/library/metadata` call. */
async function fetchPlexItemMeta(ratingKey: string): Promise<PlexItemMeta | null> {
  const metaRes = await plexFetch(`/library/metadata/${encodeURIComponent(ratingKey)}`);
  if (!metaRes?.ok) return null;
  try {
    const body = (await metaRes.json()) as { MediaContainer?: { Metadata?: PlexMetadata[] } };
    const meta = body.MediaContainer?.Metadata?.[0];
    if (!meta) return null;
    return {
      thumb: typeof meta.thumb === "string" && meta.thumb ? meta.thumb : null,
      guids: parseGuids(meta),
    };
  }
  catch {
    return null;
  }
}

/** Fetch the raw bytes behind a Plex `thumb` path, with the token appended as a query param. */
async function fetchThumbBytes(config: PlexConfig, thumb: string): Promise<Buffer | null> {
  try {
    const sep = thumb.includes("?") ? "&" : "?";
    const res = await fetch(
      `${config.baseUrl}${thumb}${sep}X-Plex-Token=${encodeURIComponent(config.token)}`,
      {
        signal: AbortSignal.timeout(PLEX_TIMEOUT_MS),
      },
    );
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return bytes.length > 0 ? bytes : null;
  }
  catch {
    return null;
  }
}

/**
 * Fetch a Plex item's poster image bytes. Resolves the item's `thumb` path from its metadata, then
 * fetches those bytes with the token as a query param. Returns `null` when unconfigured or on
 * failure. The image URL is derived from the item's own metadata — never a client value.
 */
export async function fetchPlexPoster(ratingKey: string): Promise<Buffer | null> {
  const config = await resolveConfig();
  if (!config) return null;
  const meta = await fetchPlexItemMeta(ratingKey);
  if (!meta?.thumb) return null;
  return fetchThumbBytes(config, meta.thumb);
}

/** Why a Plex poster import failed, beyond `addBookmarkImage`'s own outcomes. */
export type PlexPosterImportResult
  = | Awaited<ReturnType<typeof addBookmarkImage>>
    | "not_linked"
    | "poster_unavailable";

/**
 * Import the linked item's poster from Plex as the bookmark's main image, keeping its other images
 * (the same compress-to-WebP + store path as an upload). The bytes come straight from the operator's
 * Plex server — no client URL is fetched, so no SSRF guard applies.
 */
export async function importPlexPoster(bookmarkId: string): Promise<PlexPosterImportResult> {
  const [row] = await db
    .select({
      movieId: bookmarks.movieId,
      tvShowId: bookmarks.tvShowId,
      episodeId: bookmarks.episodeId,
      albumId: bookmarks.albumId,
      artistId: bookmarks.artistId,
      trackId: bookmarks.trackId,
      plexRatingKey: bookmarks.plexRatingKey,
    })
    .from(bookmarks)
    .where(eq(bookmarks.id, bookmarkId));
  if (!row) return "not_found";
  // Prefer the linked taxonomy row's Plex rating key, falling back to the bookmark's legacy key.
  const ratingKey = await resolveBookmarkPlexRatingKey(row, row.plexRatingKey);
  if (ratingKey === null) return "not_linked";
  const bytes = await fetchPlexPoster(ratingKey);
  if (!bytes) return "poster_unavailable";
  return addBookmarkImage(bookmarkId, bytes, "og", {
    setMain: true,
  });
}

/** The Plex-backed taxonomy tables, keyed by their `TaxonomyImageOwnerType`. */
const PLEX_TAXONOMY_TABLES = {
  movie: movies,
  tvShow: tvShows,
  episode: episodes,
  artist: artists,
  album: albums,
  track: tracks,
} as const;

/** A Plex-backed taxonomy's own kind, narrowing `TaxonomyImageOwnerType` (excludes Books/Kavita). */
export type PlexTaxonomyOwnerType = keyof typeof PLEX_TAXONOMY_TABLES;

/** Why a taxonomy Plex-poster import failed, beyond `addTaxonomyImage`'s own outcomes. */
export type PlexTaxonomyPosterImportResult
  = | AddTaxonomyImageResult
    | "not_found"
    | "not_linked"
    | "poster_unavailable";

/**
 * Import a Plex-backed taxonomy entity's own linked poster from Plex into its image gallery, keeping
 * its other images. Reads the entity's own `plexRatingKey` column directly (no bookmark indirection
 * needed — unlike bookmarks, these taxonomy rows carry the Plex link themselves).
 */
export async function importPlexPosterForTaxonomy(
  ownerType: PlexTaxonomyOwnerType,
  ownerId: string,
): Promise<PlexTaxonomyPosterImportResult> {
  const table = PLEX_TAXONOMY_TABLES[ownerType];
  const [row] = await db.select({
    plexRatingKey: table.plexRatingKey,
  }).from(table).where(eq(table.id, ownerId));
  if (!row) return "not_found";
  if (!row.plexRatingKey) return "not_linked";
  const bytes = await fetchPlexPoster(row.plexRatingKey);
  if (!bytes) return "poster_unavailable";
  return addTaxonomyImage(ownerType as TaxonomyImageOwnerType, ownerId, bytes, "plex", {
    setMain: true,
  });
}

/** The metadata fields "Autofetch from Plex" overwrites on a taxonomy row (subset of every Update*Input). */
interface TaxonomyMetadataPatch {
  name?: string;
  romanizedName?: string | null;
  wikidataId?: string | null;
  wikipediaLinkEn?: string | null;
  wikipediaLinkLocal?: string | null;
}

/** Per-taxonomy update fn used to persist autofetched names/links (regenerating the slug on rename). */
const TAXONOMY_UPDATERS: Record<
  PlexTaxonomyOwnerType,
  (id: string, input: TaxonomyMetadataPatch) => Promise<{ slug: string } | null>
> = {
  movie: updateMovie,
  tvShow: updateTvShow,
  episode: updateEpisode,
  artist: updateArtist,
  album: updateAlbum,
  track: updateTrack,
};

/**
 * Map a taxonomy's Plex guids to the Wikidata external-ID properties worth matching on, most-precise
 * first. IMDb (`P345`) covers films/shows/episodes; TMDb splits by film (`P4947`) vs TV (`P4983`);
 * music maps to the MusicBrainz artist/release-group/recording IDs.
 */
function buildExternalIds(ownerType: PlexTaxonomyOwnerType, guids: PlexGuids): WikidataExternalId[] {
  const ids: WikidataExternalId[] = [];
  const push = (property: string, value: string | null): void => {
    if (value) ids.push({
      property,
      value,
    });
  };
  switch (ownerType) {
    case "movie":
      push("P345", guids.imdb);
      push("P4947", guids.tmdb);
      break;
    case "tvShow":
    case "episode":
      push("P345", guids.imdb);
      push("P4983", guids.tmdb);
      push("P4835", guids.tvdb);
      break;
    case "artist":
      push("P434", guids.musicBrainz);
      break;
    case "album":
      push("P436", guids.musicBrainz);
      break;
    case "track":
      push("P4404", guids.musicBrainz);
      break;
  }
  return ids;
}

/** Persist the patch, retrying without the (possibly clashing) rename if the new name is taken. */
async function applyMetadataPatch(
  ownerType: PlexTaxonomyOwnerType,
  ownerId: string,
  patch: TaxonomyMetadataPatch,
): Promise<string | null> {
  const updater = TAXONOMY_UPDATERS[ownerType];
  try {
    return (await updater(ownerId, patch))?.slug ?? null;
  }
  catch {
    // A name clash (rare) — keep the metadata but drop the conflicting rename.
    const rest = {
      ...patch,
    };
    delete rest.name;
    return (await updater(ownerId, rest))?.slug ?? null;
  }
}

/** Outcome of {@link autofetchPlexTaxonomyMetadata}. */
export type PlexAutofetchResult
  = | { status: "ok";
    posterImported: boolean;
    wikidataMatched: boolean;
    /** The entity's (possibly renamed) slug, so the client can follow a rename. */
    slug: string | null; }
    | "not_found"
    | "not_linked";

/**
 * One-click "Autofetch from Plex" for a Plex-backed taxonomy row: import the linked item's poster as
 * the main image, then resolve its Wikidata item (via the Plex item's external IDs, falling back to a
 * title search) to overwrite the native-script `name`, English `romanizedName`, and Wikipedia links.
 * Poster and Wikidata each degrade independently — a failure of one still applies the other. Display
 * metadata only, so it never touches the bookmark cache.
 */
export async function autofetchPlexTaxonomyMetadata(
  ownerType: PlexTaxonomyOwnerType,
  ownerId: string,
): Promise<PlexAutofetchResult> {
  const table = PLEX_TAXONOMY_TABLES[ownerType];
  const [row] = await db
    .select({
      name: table.name,
      slug: table.slug,
      plexRatingKey: table.plexRatingKey,
      wikidataId: table.wikidataId,
    })
    .from(table)
    .where(eq(table.id, ownerId));
  if (!row) return "not_found";
  if (!row.plexRatingKey) return "not_linked";

  const config = await resolveConfig();
  const meta = config ? await fetchPlexItemMeta(row.plexRatingKey) : null;

  // 1) Poster — best-effort (needs object storage); a failure here still lets the metadata resolve.
  let posterImported = false;
  if (config && meta?.thumb && isObjectStoreConfigured()) {
    const bytes = await fetchThumbBytes(config, meta.thumb);
    if (bytes) {
      const result = await addTaxonomyImage(ownerType as TaxonomyImageOwnerType, ownerId, bytes, "plex", {
        setMain: true,
      });
      posterImported = typeof result !== "string";
    }
  }

  // 2) Wikidata metadata — native/romanized names + Wikipedia links.
  const resolution = await resolveTitleWikidata({
    name: row.name,
    wikidataId: row.wikidataId,
    externalIds: buildExternalIds(ownerType, meta?.guids ?? EMPTY_GUIDS),
  });

  let slug = row.slug ?? null;
  let wikidataMatched = false;
  if (resolution) {
    wikidataMatched = true;
    const patch: TaxonomyMetadataPatch = {
      wikidataId: resolution.wikidataId,
    };
    if (resolution.name) patch.name = resolution.name;
    if (resolution.romanizedName !== null) patch.romanizedName = resolution.romanizedName;
    if (resolution.wikipediaLinkEn !== null) patch.wikipediaLinkEn = resolution.wikipediaLinkEn;
    if (resolution.wikipediaLinkLocal !== null) patch.wikipediaLinkLocal = resolution.wikipediaLinkLocal;
    slug = (await applyMetadataPatch(ownerType, ownerId, patch)) ?? slug;
  }

  return {
    status: "ok",
    posterImported,
    wikidataMatched,
    slug,
  };
}
