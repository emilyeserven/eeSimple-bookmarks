/**
 * Optional Kavita connector (Tier 2, DEFAULT OFF). When an operator configures a base URL and an
 * API key (Settings → Connectors, or the `KAVITA_ENDPOINT` / `KAVITA_API_KEY` env vars), bookmarks
 * can be linked to a series on the Kavita server: the middleware proxies series searches and cover
 * fetches so the API key never reaches the client.
 *
 * The endpoint is operator-configured and typically points at a LAN/localhost instance, so it is
 * deliberately NOT `isPublicHttpUrl`-guarded — the same trust model as `archiveBoxEndpoint` and
 * `hostedMetadataEndpoint`. Nothing leaves the box unless the operator opts in.
 *
 * Auth uses Kavita's version-safe plugin flow: `POST /api/Plugin/authenticate` exchanges the API
 * key for a JWT, cached per endpoint+key and refreshed once on a 401. The authenticate URL carries
 * the key in its query string — never log it.
 */

import type { KavitaSeriesDetail, KavitaSeriesResult, KavitaTocEntry, KavitaTocResult } from "@eesimple/types";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { getActiveKavitaEndpoint, getDecryptedKavitaApiKey } from "@/services/appSettings";
import { addBookmarkImage } from "@/services/bookmarkImages";
import { extractPdfToc } from "@/services/pdfToc";

const KAVITA_TIMEOUT_MS = 10000;
// A PDF download is the one slow, large Kavita call: give it a longer timeout and cap its size.
const KAVITA_PDF_TIMEOUT_MS = 60000;
const KAVITA_PDF_MAX_BYTES = 100 * 1024 * 1024;
const PLUGIN_NAME = "eeSimple Bookmarks";

let cachedToken: string | null = null;
let cachedForConfig: string | null = null;

/** Drop the cached JWT (tests, or after a 401). */
export function resetKavitaAuthCache(): void {
  cachedToken = null;
  cachedForConfig = null;
}

/** Whether a Kavita server is configured — both base URL and API key resolve (DB first, then env). */
export async function kavitaEnabledAsync(): Promise<boolean> {
  return Boolean(await getActiveKavitaEndpoint()) && Boolean(await getDecryptedKavitaApiKey());
}

interface KavitaConfig {
  baseUrl: string;
  apiKey: string;
}

async function resolveConfig(): Promise<KavitaConfig | null> {
  const endpoint = await getActiveKavitaEndpoint();
  const apiKey = await getDecryptedKavitaApiKey();
  if (!endpoint || !apiKey) return null;
  return {
    baseUrl: endpoint.replace(/\/$/, ""),
    apiKey,
  };
}

/** Exchange the API key for a JWT via Kavita's plugin auth. Returns `null` on failure. */
async function authenticate(config: KavitaConfig): Promise<string | null> {
  try {
    const query = `apiKey=${encodeURIComponent(config.apiKey)}&pluginName=${encodeURIComponent(PLUGIN_NAME)}`;
    const res = await fetch(`${config.baseUrl}/api/Plugin/authenticate?${query}`, {
      method: "POST",
      signal: AbortSignal.timeout(KAVITA_TIMEOUT_MS),
      headers: {
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { token?: unknown };
    return typeof body.token === "string" && body.token ? body.token : null;
  }
  catch {
    return null;
  }
}

async function getToken(config: KavitaConfig): Promise<string | null> {
  const configKey = `${config.baseUrl} ${config.apiKey}`;
  if (cachedToken && cachedForConfig === configKey) return cachedToken;
  const token = await authenticate(config);
  cachedToken = token;
  cachedForConfig = token ? configKey : null;
  return token;
}

/**
 * GET an authenticated Kavita API path (e.g. `/api/Search/search?...`). Re-authenticates once on a
 * 401 (expired/stale JWT). Returns `null` when unconfigured, auth fails, or the request errors.
 */
async function kavitaFetch(path: string, timeoutMs = KAVITA_TIMEOUT_MS): Promise<Response | null> {
  const config = await resolveConfig();
  if (!config) return null;
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const token = await getToken(config);
      if (!token) return null;
      const res = await fetch(`${config.baseUrl}${path}`, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401 && attempt === 0) {
        // Stale JWT — drop the cache and re-authenticate once.
        resetKavitaAuthCache();
        continue;
      }
      return res;
    }
    return null;
  }
  catch {
    return null;
  }
}

/** Shape of the entries in Kavita's `SearchResultGroupDto.series`. */
interface KavitaSearchSeries {
  seriesId?: unknown;
  libraryId?: unknown;
  name?: unknown;
  libraryName?: unknown;
  releaseYear?: unknown;
}

function toSeriesResult(raw: KavitaSearchSeries): KavitaSeriesResult | null {
  if (typeof raw.seriesId !== "number" || typeof raw.libraryId !== "number") return null;
  if (typeof raw.name !== "string" || !raw.name) return null;
  return {
    seriesId: raw.seriesId,
    libraryId: raw.libraryId,
    name: raw.name,
    libraryName: typeof raw.libraryName === "string" && raw.libraryName ? raw.libraryName : null,
    releaseYear: typeof raw.releaseYear === "number" && raw.releaseYear > 0 ? raw.releaseYear : null,
  };
}

/** Build the middleware-proxied cover URL for a Kavita series (`GET /api/kavita/series/:id/cover`). */
export function kavitaSeriesCoverUrl(seriesId: number): string {
  return `/api/kavita/series/${seriesId}/cover`;
}

/**
 * Search the Kavita server for series matching `query` by name. Returns `[]` when the connector is
 * unconfigured or any step fails. Never throws. This deliberately omits chapters/files
 * (`includeChapterAndFiles=false`) for speed — Kavita's series-name query only matches
 * `Series.Name`/`OriginalName`/`LocalizedName`/`NormalizedName`, **not** ISBN, so this alone cannot
 * find a book by ISBN. Use {@link searchKavitaByIsbn} for that.
 */
export async function searchKavitaSeries(query: string): Promise<KavitaSeriesResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const res = await kavitaFetch(
    `/api/Search/search?queryString=${encodeURIComponent(trimmed)}&includeChapterAndFiles=false`,
  );
  if (!res?.ok) return [];
  try {
    const body = (await res.json()) as { series?: unknown };
    if (!Array.isArray(body.series)) return [];
    return body.series
      .map(entry => toSeriesResult(entry as KavitaSearchSeries))
      .filter((entry): entry is KavitaSeriesResult => entry !== null);
  }
  catch {
    return [];
  }
}

/** Shape of Kavita's `GET /api/Series/{id}` response (a `SeriesDto`) — only the field this needs. */
interface KavitaSeriesDetailDto {
  name?: unknown;
}

/** Shape of Kavita's `GET /api/Metadata/series/{id}` response (a `SeriesMetadataDto`) — only the field this needs. */
interface KavitaSeriesMetadataDto {
  releaseYear?: unknown;
}

/** Outcome of a series-detail fetch, mapped to HTTP statuses by the route. */
export type KavitaSeriesDetailOutcome
  = | { status: "ok";
    result: KavitaSeriesDetail; }
    | { status: "not_found" }
    | { status: "unavailable" };

/**
 * Fetch a linked series' current live name and release year directly from Kavita, so the client can
 * flag drift against the local Book's own values. Read-only — this never writes to Kavita (the
 * connector has no write path; see the module doc). A metadata-fetch failure doesn't fail the whole
 * call — `releaseYear` just comes back `null`. Never throws.
 */
export async function fetchKavitaSeriesDetail(seriesId: number): Promise<KavitaSeriesDetailOutcome> {
  const seriesRes = await kavitaFetch(`/api/Series/${seriesId}`);
  if (!seriesRes) return {
    status: "unavailable",
  };
  if (seriesRes.status === 404) return {
    status: "not_found",
  };
  if (!seriesRes.ok) return {
    status: "unavailable",
  };
  try {
    const series = (await seriesRes.json()) as KavitaSeriesDetailDto;
    if (typeof series.name !== "string" || !series.name) return {
      status: "unavailable",
    };
    let releaseYear: number | null = null;
    const metadataRes = await kavitaFetch(`/api/Metadata/series/${seriesId}`);
    if (metadataRes?.ok) {
      const metadata = (await metadataRes.json()) as KavitaSeriesMetadataDto;
      releaseYear = typeof metadata.releaseYear === "number" && metadata.releaseYear > 0
        ? metadata.releaseYear
        : null;
    }
    return {
      status: "ok",
      result: {
        seriesId,
        name: series.name,
        releaseYear,
      },
    };
  }
  catch {
    return {
      status: "unavailable",
    };
  }
}

/** Shape of the `GET /api/Search/series-for-chapter` response used to resolve an ISBN-matched chapter's series. */
interface KavitaSeriesDto {
  id?: unknown;
  libraryId?: unknown;
  name?: unknown;
  libraryName?: unknown;
}

function toSeriesResultFromSeriesDto(raw: KavitaSeriesDto): KavitaSeriesResult | null {
  if (typeof raw.id !== "number" || typeof raw.libraryId !== "number") return null;
  if (typeof raw.name !== "string" || !raw.name) return null;
  return {
    seriesId: raw.id,
    libraryId: raw.libraryId,
    name: raw.name,
    libraryName: typeof raw.libraryName === "string" && raw.libraryName ? raw.libraryName : null,
    // Not available on the series-for-chapter response; the ISBN fallback leaves it blank.
    releaseYear: null,
  };
}

/** Outcome of an ISBN search against Kavita, distinguishing a genuine miss from an unreachable server. */
export type KavitaIsbnSearchOutcome
  = | { status: "ok";
    result: KavitaSeriesResult; }
    | { status: "no_match" }
    | { status: "unreachable" };

/**
 * Look up a Kavita series by ISBN. Kavita only matches ISBN against **Chapter.ISBN** (parsed from a
 * book's ComicInfo/EPUB metadata) — never against series name — and only runs that match when
 * `includeChapterAndFiles=true` (the general {@link searchKavitaSeries} name search always passes
 * `false` and would never surface an ISBN hit). This resolves the matching chapter's parent series
 * via `GET /api/Search/series-for-chapter` since the chapter search result carries no series info.
 */
export async function searchKavitaByIsbn(isbn: string): Promise<KavitaIsbnSearchOutcome> {
  const trimmed = isbn.trim();
  if (!trimmed) return {
    status: "no_match",
  };
  const res = await kavitaFetch(
    `/api/Search/search?queryString=${encodeURIComponent(trimmed)}&includeChapterAndFiles=true`,
  );
  if (!res?.ok) return {
    status: "unreachable",
  };
  try {
    const body = (await res.json()) as { chapters?: unknown };
    if (!Array.isArray(body.chapters)) return {
      status: "unreachable",
    };
    const chapterId = (body.chapters as { id?: unknown }[]).find(c => typeof c.id === "number")?.id;
    if (typeof chapterId !== "number") return {
      status: "no_match",
    };
    const seriesRes = await kavitaFetch(`/api/Search/series-for-chapter?chapterId=${chapterId}`);
    if (!seriesRes?.ok) return {
      status: "unreachable",
    };
    const result = toSeriesResultFromSeriesDto((await seriesRes.json()) as KavitaSeriesDto);
    return result
      ? {
        status: "ok",
        result,
      }
      : {
        status: "unreachable",
      };
  }
  catch {
    return {
      status: "unreachable",
    };
  }
}

/** Kavita's `MangaFormat` enum values for the two book formats a ToC can be read from. */
const MANGA_FORMAT_EPUB = 3;
const MANGA_FORMAT_PDF = 4;

interface TocChapter {
  chapterId: number;
  format: "epub" | "pdf";
  /** The chapter's total page count, or `null` when Kavita doesn't report a usable one. */
  pages: number | null;
}

/** Shape of the volume/chapter/file entries in Kavita's `GET /api/Series/volumes` response. */
interface KavitaVolume {
  chapters?: unknown;
}
interface KavitaChapter {
  id?: unknown;
  pages?: unknown;
  files?: unknown;
}
interface KavitaFile {
  format?: unknown;
}

function chapterBookFormat(chapter: KavitaChapter): "epub" | "pdf" | null {
  if (!Array.isArray(chapter.files)) return null;
  for (const file of chapter.files as KavitaFile[]) {
    if (file.format === MANGA_FORMAT_EPUB) return "epub";
    if (file.format === MANGA_FORMAT_PDF) return "pdf";
  }
  return null;
}

/**
 * Find the series' first EPUB/PDF chapter (volumes and chapters in Kavita's order) — the file a
 * table of contents can be read from. `{ ok: false }` = the volumes call itself failed;
 * `chapter: null` = the series has no EPUB/PDF file.
 */
async function resolveTocChapter(
  seriesId: number,
): Promise<{ ok: false } | { ok: true;
  chapter: TocChapter | null; }> {
  const res = await kavitaFetch(`/api/Series/volumes?seriesId=${seriesId}`);
  if (!res?.ok) return {
    ok: false,
  };
  try {
    const volumes = (await res.json()) as unknown;
    if (!Array.isArray(volumes)) return {
      ok: false,
    };
    for (const volume of volumes as KavitaVolume[]) {
      if (!Array.isArray(volume.chapters)) continue;
      for (const chapter of volume.chapters as KavitaChapter[]) {
        const format = chapterBookFormat(chapter);
        if (format === null || typeof chapter.id !== "number") continue;
        return {
          ok: true,
          chapter: {
            chapterId: chapter.id,
            format,
            pages: typeof chapter.pages === "number" && chapter.pages > 0 ? chapter.pages : null,
          },
        };
      }
    }
    return {
      ok: true,
      chapter: null,
    };
  }
  catch {
    return {
      ok: false,
    };
  }
}

/** Shape of the entries in Kavita's `GET /api/Book/{chapterId}/chapters` (EPUB ToC) response. */
interface KavitaBookChapterItem {
  title?: unknown;
  page?: unknown;
  children?: unknown;
}

function toEpubTocEntry(item: KavitaBookChapterItem): KavitaTocEntry | null {
  const title = typeof item.title === "string" ? item.title.trim() : "";
  if (!title || typeof item.page !== "number" || item.page < 0) return null;
  // Kavita's book-reader pages are 0-based; normalize to 1-based like the PDF path.
  return {
    title,
    page: item.page + 1,
  };
}

/**
 * Fetch an EPUB chapter's table of contents via Kavita's book API, flattening the top two levels
 * in document order. Returns `null` on any failure (the endpoint errors on non-EPUB files).
 */
async function fetchEpubToc(chapterId: number): Promise<KavitaTocEntry[] | null> {
  const res = await kavitaFetch(`/api/Book/${chapterId}/chapters`);
  if (!res?.ok) return null;
  try {
    const items = (await res.json()) as unknown;
    if (!Array.isArray(items)) return null;
    const twoLevels = (items as KavitaBookChapterItem[]).flatMap(item => [
      item,
      ...(Array.isArray(item.children) ? (item.children as KavitaBookChapterItem[]) : []),
    ]);
    return twoLevels
      .map(toEpubTocEntry)
      .filter((entry): entry is KavitaTocEntry => entry !== null);
  }
  catch {
    return null;
  }
}

/** Read a response body incrementally, aborting (null) once `maxBytes` is exceeded. */
async function readBodyCapped(res: Response, maxBytes: number): Promise<Uint8Array | null> {
  const declared = Number(res.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!res.body) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  for await (const chunk of res.body as AsyncIterable<Uint8Array>) {
    total += chunk.byteLength;
    if (total > maxBytes) return null;
    chunks.push(chunk);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

/** The pdf-extraction dependency, injectable so tests can stub the pdfjs-backed extractor. */
interface KavitaTocDeps {
  extractPdfToc: typeof extractPdfToc;
}

/**
 * Download a PDF chapter from Kavita (size-capped) and extract its embedded outline. The download
 * endpoint needs both auth forms: the Bearer JWT (sent by `kavitaFetch`) and the `apiKey` query
 * param. Returns `null` on any failure.
 */
async function fetchPdfToc(chapterId: number, deps: KavitaTocDeps): Promise<KavitaTocEntry[] | null> {
  const config = await resolveConfig();
  if (!config) return null;
  const res = await kavitaFetch(
    `/api/Reader/pdf?chapterId=${chapterId}&apiKey=${encodeURIComponent(config.apiKey)}`,
    KAVITA_PDF_TIMEOUT_MS,
  );
  if (!res?.ok) return null;
  try {
    const bytes = await readBodyCapped(res, KAVITA_PDF_MAX_BYTES);
    if (!bytes) return null;
    return await deps.extractPdfToc(bytes);
  }
  catch {
    return null;
  }
}

/** Outcome of a ToC fetch, mapped to HTTP statuses by the route. */
export type KavitaTocOutcome
  = | { status: "ok";
    result: KavitaTocResult; }
    | { status: "no_chapter" }
    | { status: "unavailable" };

/**
 * Fetch the table of contents for a Kavita series: resolve its first EPUB/PDF chapter, then read
 * the ToC via Kavita's book API (EPUB) or by parsing the downloaded file's embedded outline (PDF).
 * `entries: []` with `status: "ok"` means the book genuinely has no ToC. Never throws.
 */
export async function fetchKavitaToc(
  seriesId: number,
  deps: KavitaTocDeps = {
    extractPdfToc,
  },
): Promise<KavitaTocOutcome> {
  const resolved = await resolveTocChapter(seriesId);
  if (!resolved.ok) return {
    status: "unavailable",
  };
  if (resolved.chapter === null) return {
    status: "no_chapter",
  };
  const {
    chapterId, format, pages,
  } = resolved.chapter;
  const entries = format === "epub"
    ? await fetchEpubToc(chapterId)
    : await fetchPdfToc(chapterId, deps);
  if (entries === null) return {
    status: "unavailable",
  };
  return {
    status: "ok",
    result: {
      entries,
      pages,
    },
  };
}

/** Why a Kavita cover import failed, beyond `addBookmarkImage`'s own outcomes. */
export type KavitaCoverImportResult
  = | Awaited<ReturnType<typeof addBookmarkImage>>
    | "not_linked"
    | "cover_unavailable";

/**
 * Import the linked series' cover from Kavita as the bookmark's main image, keeping its other
 * images (the same compress-to-WebP + store path as an upload). The bytes come straight from the
 * operator's Kavita server — no URL is re-fetched, so no SSRF guard applies.
 */
export async function importKavitaSeriesCover(bookmarkId: string): Promise<KavitaCoverImportResult> {
  const [row] = await db
    .select({
      kavitaSeriesId: bookmarks.kavitaSeriesId,
    })
    .from(bookmarks)
    .where(eq(bookmarks.id, bookmarkId));
  if (!row) return "not_found";
  if (row.kavitaSeriesId === null) return "not_linked";
  const bytes = await fetchKavitaSeriesCover(row.kavitaSeriesId);
  if (!bytes) return "cover_unavailable";
  return addBookmarkImage(bookmarkId, bytes, "og", {
    setMain: true,
  });
}

/**
 * Fetch a series' cover image bytes. Kavita's image endpoint authenticates via an `apiKey` query
 * param (no JWT), so this bypasses `kavitaFetch`. Returns `null` when unconfigured or on failure.
 */
export async function fetchKavitaSeriesCover(seriesId: number): Promise<Buffer | null> {
  const config = await resolveConfig();
  if (!config) return null;
  try {
    const res = await fetch(
      `${config.baseUrl}/api/Image/series-cover?seriesId=${seriesId}&apiKey=${encodeURIComponent(config.apiKey)}`,
      {
        signal: AbortSignal.timeout(KAVITA_TIMEOUT_MS),
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
