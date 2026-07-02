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

import type { PlexItemResult } from "@eesimple/types";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { getActivePlexEndpoint, getDecryptedPlexToken } from "@/services/appSettings";
import { addBookmarkImage } from "@/services/bookmarkImages";

const PLEX_TIMEOUT_MS = 10000;
// /identity is polled indirectly by the frequently-called /api/connectors endpoint; keep it snappy
// so an unreachable Plex server doesn't stall that response.
const PLEX_IDENTITY_TIMEOUT_MS = 5000;
// The Plex item types worth linking a bookmark to (search surfaces collections/clips/playlists too).
const LINKABLE_TYPES = new Set(["movie", "show", "season", "episode", "artist", "album", "track"]);

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
  parentTitle?: unknown;
}

/** Compose a one-line context subtitle: show/artist · year · library. */
function composeSubtitle(raw: PlexMetadata): string | null {
  const year = typeof raw.year === "number" && raw.year > 0 ? String(raw.year) : null;
  const parts = [
    typeof raw.grandparentTitle === "string" && raw.grandparentTitle ? raw.grandparentTitle : null,
    year,
    typeof raw.librarySectionTitle === "string" && raw.librarySectionTitle ? raw.librarySectionTitle : null,
  ].filter(Boolean);
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
  return {
    ratingKey,
    type: raw.type,
    title: raw.title,
    year: typeof raw.year === "number" && raw.year > 0 ? raw.year : null,
    librarySectionTitle:
      typeof raw.librarySectionTitle === "string" && raw.librarySectionTitle ? raw.librarySectionTitle : null,
    subtitle: composeSubtitle(raw),
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
 * Search the Plex server for items matching `query` across all libraries. Returns `[]` when the
 * connector is unconfigured or any step fails. Never throws.
 */
export async function searchPlexItems(query: string): Promise<PlexItemResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const res = await plexFetch(`/hubs/search?query=${encodeURIComponent(trimmed)}&limit=30`);
  if (!res?.ok) return [];
  try {
    const items = collectMetadata(await res.json());
    return items
      .map(toItemResult)
      .filter((entry): entry is PlexItemResult => entry !== null);
  }
  catch {
    return [];
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
  const metaRes = await plexFetch(`/library/metadata/${encodeURIComponent(ratingKey)}`);
  if (!metaRes?.ok) return null;
  try {
    const body = (await metaRes.json()) as { MediaContainer?: { Metadata?: PlexMetadata[] } };
    const thumb = body.MediaContainer?.Metadata?.[0]?.thumb;
    if (typeof thumb !== "string" || !thumb) return null;
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
      plexRatingKey: bookmarks.plexRatingKey,
    })
    .from(bookmarks)
    .where(eq(bookmarks.id, bookmarkId));
  if (!row) return "not_found";
  if (row.plexRatingKey === null) return "not_linked";
  const bytes = await fetchPlexPoster(row.plexRatingKey);
  if (!bytes) return "poster_unavailable";
  return addBookmarkImage(bookmarkId, bytes, "og", {
    setMain: true,
  });
}
