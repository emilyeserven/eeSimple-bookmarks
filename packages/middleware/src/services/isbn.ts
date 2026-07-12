/**
 * ISBN/book metadata lookup with a keyless provider fallback chain: Open Library first, then Google
 * Books, then — when both public providers miss and an operator has configured a Kavita server —
 * the operator's own Kavita library (catches self-published/indie titles the public databases don't
 * know about). Each provider reports a discriminated outcome so the route can distinguish "no book
 * found" (→ 404) from "couldn't reach the provider" (→ 502).
 */

import type { FetchIsbnMetadataResult } from "@eesimple/types";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookmarkTextValues, customProperties } from "@/db/schema";
import { addBookmarkImage, type SetImageResult } from "@/services/bookmarkImages";
import { ISBN_SLUG } from "@/services/customProperties";
import {
  fetchKavitaSeriesCover,
  kavitaEnabledAsync,
  kavitaSeriesCoverUrl,
  searchKavitaByIsbn,
} from "@/services/kavita";
import { downloadImage, isPublicHttpUrl } from "@/services/metadata";
import { normalizeLanguageCode } from "@/utils/languageCodes";

const ISBN_TIMEOUT_MS = 10_000;
const ISBN_USER_AGENT = "eeSimple-bookmarks/1.0";

/**
 * A lookup outcome: a usable result, a definitive "not found", or a transport failure. `not_found`
 * and `error` may carry a `debug` clause — currently only set from the Kavita step — surfaced by the
 * route as the error toast's diagnostic detail.
 */
export type IsbnLookupOutcome
  = | { kind: "ok";
    result: FetchIsbnMetadataResult; }
    | { kind: "not_found";
      debug?: string; }
      | { kind: "error";
        debug?: string; };

/** Upgrade an `http://` cover URL to `https://` (Google Books serves http thumbnails), else pass through. */
function toHttps(url: string | undefined | null): string | null {
  if (!url) return null;
  return url.startsWith("http://") ? `https://${url.slice("http://".length)}` : url;
}

/** Look up a book by ISBN via Open Library's read API. */
export async function fetchOpenLibrary(isbn: string): Promise<IsbnLookupOutcome> {
  const apiUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`;
  let rawJson: Record<string, unknown>;
  try {
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": ISBN_USER_AGENT,
      },
      signal: AbortSignal.timeout(ISBN_TIMEOUT_MS),
    });
    if (!response.ok) return {
      kind: "error",
    };
    rawJson = (await response.json()) as Record<string, unknown>;
  }
  catch {
    return {
      kind: "error",
    };
  }

  const data = rawJson[`ISBN:${isbn}`] as Record<string, unknown> | undefined;
  if (!data) return {
    kind: "not_found",
  };

  const descRaw = data.description as { value?: string } | string | undefined;
  const description = typeof descRaw === "string"
    ? descRaw
    : typeof descRaw === "object" && descRaw !== null
      ? (descRaw.value ?? null)
      : null;
  const coversRaw = data.cover as { large?: string;
    medium?: string; } | undefined;
  const authorsRaw = data.authors as { name?: string }[] | undefined;
  // MARC/ISO 639-2 bibliographic codes, e.g. `[{ key: "/languages/eng" }]`.
  const languagesRaw = data.languages as { key?: string }[] | undefined;
  const rawLanguageCode = languagesRaw?.[0]?.key?.split("/").pop();

  return {
    kind: "ok",
    result: {
      title: typeof data.title === "string" ? data.title : null,
      description,
      coverUrl: coversRaw?.large ?? coversRaw?.medium ?? null,
      authors: authorsRaw?.map(a => a.name ?? "").filter(Boolean) ?? [],
      year: typeof data.publish_date === "string" ? data.publish_date : null,
      openLibraryUrl: typeof data.url === "string" ? data.url : null,
      language: normalizeLanguageCode(rawLanguageCode),
    },
  };
}

/** Shape of the Google Books `volumeInfo` fields we consume. */
interface GoogleVolumeInfo {
  title?: unknown;
  description?: unknown;
  authors?: unknown;
  publishedDate?: unknown;
  /** ISO 639-1 code (e.g. `"en"`), already the format `Language.isoCode` uses. */
  language?: unknown;
  imageLinks?: { thumbnail?: unknown;
    smallThumbnail?: unknown; };
}

/** Look up a book by ISBN via the keyless Google Books volumes API (broader coverage than Open Library). */
export async function fetchGoogleBooks(isbn: string): Promise<IsbnLookupOutcome> {
  const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`;
  let rawJson: { items?: { volumeInfo?: GoogleVolumeInfo }[] };
  try {
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": ISBN_USER_AGENT,
      },
      signal: AbortSignal.timeout(ISBN_TIMEOUT_MS),
    });
    if (!response.ok) return {
      kind: "error",
    };
    rawJson = (await response.json()) as { items?: { volumeInfo?: GoogleVolumeInfo }[] };
  }
  catch {
    return {
      kind: "error",
    };
  }

  const info = rawJson.items?.[0]?.volumeInfo;
  if (!info) return {
    kind: "not_found",
  };

  const authors = Array.isArray(info.authors)
    ? info.authors.filter((a): a is string => typeof a === "string")
    : [];
  const thumb = typeof info.imageLinks?.thumbnail === "string"
    ? info.imageLinks.thumbnail
    : typeof info.imageLinks?.smallThumbnail === "string"
      ? info.imageLinks.smallThumbnail
      : null;

  return {
    kind: "ok",
    result: {
      title: typeof info.title === "string" ? info.title : null,
      description: typeof info.description === "string" ? info.description : null,
      coverUrl: toHttps(thumb),
      authors,
      year: typeof info.publishedDate === "string" ? info.publishedDate : null,
      // Google Books results have no Open Library page.
      openLibraryUrl: null,
      language: normalizeLanguageCode(typeof info.language === "string" ? info.language : null),
    },
  };
}

/**
 * Look up a book by ISBN on the operator's own Kavita server, when configured. Kavita matches ISBN
 * only against a **Chapter**'s parsed ComicInfo/EPUB metadata — see {@link searchKavitaByIsbn} — so
 * this resolves the matching chapter's series. Returns `not_found` when Kavita is unconfigured or
 * has no match — never `error`, since an unconfigured/unreachable Kavita server shouldn't override a
 * definitive miss from the public providers. The `debug` clause explains which of those it was, for
 * the error toast.
 */
async function fetchKavita(isbn: string): Promise<IsbnLookupOutcome> {
  if (!(await kavitaEnabledAsync())) return {
    kind: "not_found",
    debug: "Kavita lookup skipped — no server configured under Settings → Connectors.",
  };
  const outcome = await searchKavitaByIsbn(isbn);
  if (outcome.status === "unreachable") return {
    kind: "not_found",
    debug: "Could not reach your Kavita library — check the endpoint/API key under Settings → Connectors.",
  };
  if (outcome.status === "no_match") return {
    kind: "not_found",
    debug: "Searched your Kavita library — no book has this ISBN yet. If you just added it, run a library scan in Kavita first.",
  };
  const match = outcome.result;
  return {
    kind: "ok",
    result: {
      title: match.name,
      description: null,
      coverUrl: kavitaSeriesCoverUrl(match.seriesId),
      authors: [],
      year: match.releaseYear ? String(match.releaseYear) : null,
      openLibraryUrl: null,
      // Kavita's series-search match carries no language metadata.
      language: null,
      kavitaSeriesId: match.seriesId,
    },
  };
}

/**
 * Resolve ISBN metadata via the fallback chain: Open Library first; fall back to Google Books when
 * Open Library has no titled result; fall back to the operator's Kavita library when neither public
 * provider turned up anything usable. Returns the first usable result, else a definitive
 * `not_found` (at least one provider answered), else `error` (all providers were unreachable).
 */
export async function fetchIsbnMetadata(isbn: string): Promise<IsbnLookupOutcome> {
  const ol = await fetchOpenLibrary(isbn);
  if (ol.kind === "ok" && ol.result.title) return ol;

  const gb = await fetchGoogleBooks(isbn);
  if (gb.kind === "ok") return gb;

  // Google Books added nothing usable — keep a titleless Open Library hit if we have one.
  if (ol.kind === "ok") return ol;

  // Neither public provider had a titled result — try the operator's own Kavita library before
  // giving up.
  const kv = await fetchKavita(isbn);
  if (kv.kind === "ok") return kv;

  if (ol.kind === "not_found" || gb.kind === "not_found") return {
    kind: "not_found",
    debug: kv.debug,
  };
  return {
    kind: "error",
    debug: kv.debug,
  };
}

/** Why an ISBN cover import failed, beyond `addBookmarkImage`'s own outcomes. */
export type IsbnCoverImportResult
  = | SetImageResult
    | "too_many"
    | "no_isbn"
    | "isbn_not_found"
    | "cover_unavailable";

/**
 * Look up the bookmark's stored ISBN/ASIN value and import the resulting cover (if any) as the
 * bookmark's main image, keeping its other images. A Kavita-fallback result carries a
 * `kavitaSeriesId` — its `coverUrl` is a middleware-relative proxy path that requires the
 * authenticated Kavita API, so that case fetches the bytes directly via
 * {@link fetchKavitaSeriesCover} instead of downloading `coverUrl`. Public-provider results
 * download `coverUrl` directly, guarded by `isPublicHttpUrl`.
 */
export async function importIsbnCover(bookmarkId: string): Promise<IsbnCoverImportResult> {
  const [row] = await db
    .select({
      value: bookmarkTextValues.value,
    })
    .from(bookmarkTextValues)
    .innerJoin(customProperties, eq(bookmarkTextValues.propertyId, customProperties.id))
    .where(and(
      eq(bookmarkTextValues.bookmarkId, bookmarkId),
      eq(customProperties.slug, ISBN_SLUG),
    ));
  const isbn = row?.value.trim();
  if (!isbn) return "no_isbn";

  const outcome = await fetchIsbnMetadata(isbn);
  if (outcome.kind !== "ok") {
    return outcome.kind === "not_found" ? "isbn_not_found" : "cover_unavailable";
  }
  const {
    coverUrl, kavitaSeriesId,
  } = outcome.result;
  const bytes = kavitaSeriesId != null
    ? await fetchKavitaSeriesCover(kavitaSeriesId)
    : coverUrl && isPublicHttpUrl(coverUrl)
      ? await downloadImage(coverUrl)
      : null;
  if (!bytes) return "cover_unavailable";
  return addBookmarkImage(bookmarkId, bytes, "og", {
    setMain: true,
  });
}
