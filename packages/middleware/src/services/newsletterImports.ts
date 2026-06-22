/**
 * Newsletter import orchestration: turn raw newsletter content into a reviewable queue of candidate
 * bookmarks, and approve/reject/edit those candidates. The pure extraction lives in
 * `newsletterIngest.ts` and the redirect resolution in `redirectUnwrap.ts`; this module wires them to
 * the DB and, on approval, to `createBookmark`.
 *
 * Staging rows are NOT matchable bookmark data, so writes here never call `invalidateBookmarkCache`.
 * Only `createBookmark` (invoked on approve) touches the cache, which it already does internally.
 */

import { and, asc, eq, inArray } from "drizzle-orm";
import type {
  NewsletterApproveResult,
  NewsletterImport,
  NewsletterImportItem,
  NewsletterImportItemStatus,
  NewsletterImportSource,
  NewsletterImportSummary,
  UpdateNewsletterImportItemInput,
} from "@eesimple/types";
import { canonicalize, isBlacklisted } from "@eesimple/types";
import { db } from "@/db";
import {
  bookmarks,
  type NewsletterImportItemRow,
  newsletterImportItems,
  newsletterImports,
  type NewsletterImportRow,
} from "@/db/schema";
import { getNewsletterBlacklist, getShortenerIgnoreList } from "@/services/appSettings";
import { checkBookmarkUrlDuplicate, createBookmark, DuplicateUrlError } from "@/services/bookmarks";
import {
  extractCandidates,
  extractEmlHtml,
  filterAndDedupe,
  type LinkCandidate,
} from "@/services/newsletterIngest";
import {
  extractDescription,
  extractImageUrl,
  extractTitle,
  fetchHeadHtml,
  isPublicHttpUrl,
} from "@/services/metadata";
import {
  getNewsletterCategoryId,
  getNewsletterMediaTypeId,
  getNewsletterTagIds,
} from "@/services/newsletters";
import { mapWithConcurrency, unwrapRedirect } from "@/services/redirectUnwrap";
import { listWebsites } from "@/services/websites";

/** Concurrent outbound fetches for redirect unwrap / enrichment (bounded; see `mapWithConcurrency`). */
const FETCH_CONCURRENCY = 6;
const ENRICH_CONCURRENCY = 5;

const STATUS_KEYS: NewsletterImportItemStatus[] = [
  "pending",
  "approved",
  "rejected",
  "duplicate",
  "error",
];

/** What `ingestNewsletter` needs, regardless of which entry point produced it. */
export interface IngestInput {
  source: NewsletterImportSource;
  /** Raw newsletter content (HTML or text). For `.eml` the caller extracts the HTML first. */
  content: string;
  kind: "html" | "text" | "auto";
  title?: string | null;
  sourceUrl?: string | null;
  enrich?: boolean;
  /** The newsletter (publication) this import/issue belongs to, or `null`. */
  newsletterId?: string | null;
  /** Default category applied to every link approved from this import. */
  defaultCategoryId?: string | null;
}

function isoOf(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function toItem(row: NewsletterImportItemRow): NewsletterImportItem {
  return {
    id: row.id,
    importId: row.importId,
    url: row.url,
    rawUrl: row.rawUrl,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    anchorText: row.anchorText,
    categoryId: row.categoryId,
    status: row.status as NewsletterImportItemStatus,
    duplicateBookmarkId: row.duplicateBookmarkId,
    createdBookmarkId: row.createdBookmarkId,
    errorReason: row.errorReason,
    createdAt: isoOf(row.createdAt),
  };
}

/** A candidate after redirect-unwrap + canonicalize, ready to stage. */
interface ResolvedCandidate {
  rawUrl: string;
  anchorText: string;
  url: string | null;
  status: NewsletterImportItemStatus;
  errorReason: string | null;
}

/** Unwrap a candidate's tracker URL and canonicalize the destination. Falls back to the raw URL on a
 * non-security failure so a slow/blocking article server doesn't drop the link; only an SSRF block
 * marks the row as an error. */
async function resolveCandidate(
  candidate: LinkCandidate,
  data: { mode: "trackers";
    websites: Awaited<ReturnType<typeof listWebsites>>;
    ignoreList: string[]; },
): Promise<ResolvedCandidate> {
  const result = await unwrapRedirect(candidate.rawUrl);
  if (result.kind === "blocked") {
    return {
      rawUrl: candidate.rawUrl,
      anchorText: candidate.anchorText,
      url: null,
      status: "error",
      errorReason: "Link redirected to a blocked (private) address.",
    };
  }
  const destination = result.kind === "ok" ? result.finalUrl : candidate.rawUrl;
  return {
    rawUrl: candidate.rawUrl,
    anchorText: candidate.anchorText,
    url: canonicalize(destination, data).url,
    status: "pending",
    errorReason: null,
  };
}

/** Collapse candidates that resolved to the same canonical URL, keeping the richest anchor text. */
function dedupeResolved(items: ResolvedCandidate[]): ResolvedCandidate[] {
  const byUrl = new Map<string, ResolvedCandidate>();
  const passthrough: ResolvedCandidate[] = [];
  for (const item of items) {
    if (item.url === null) {
      passthrough.push(item); // errored rows always kept (each is distinct)
      continue;
    }
    const existing = byUrl.get(item.url);
    if (!existing) byUrl.set(item.url, item);
    else if (item.anchorText.length > existing.anchorText.length) {
      byUrl.set(item.url, {
        ...existing,
        anchorText: item.anchorText,
      });
    }
  }
  return [...byUrl.values(), ...passthrough];
}

/** Pre-mark a resolved candidate as a duplicate when its URL already exists as a bookmark. */
async function withDuplicateFlag(item: ResolvedCandidate): Promise<{
  item: ResolvedCandidate;
  duplicateBookmarkId: string | null;
}> {
  if (item.url === null || item.status !== "pending") return {
    item,
    duplicateBookmarkId: null,
  };
  const dup = await checkBookmarkUrlDuplicate(item.url);
  const match = dup.exactMatch ?? dup.pathMatch;
  if (match) return {
    item: {
      ...item,
      status: "duplicate",
    },
    duplicateBookmarkId: match.id,
  };
  return {
    item,
    duplicateBookmarkId: null,
  };
}

/** Eagerly fetch a candidate's page title/description/image (best-effort; never throws). */
async function enrichCandidate(
  item: ResolvedCandidate,
): Promise<{ title: string | null;
  description: string | null;
  imageUrl: string | null; }> {
  const seedTitle = item.anchorText.trim() || null;
  if (item.url === null || item.status !== "pending") {
    return {
      title: seedTitle,
      description: null,
      imageUrl: null,
    };
  }
  const html = await fetchHeadHtml(item.url);
  if (html === null) return {
    title: seedTitle,
    description: null,
    imageUrl: null,
  };
  const image = extractImageUrl(html, item.url);
  return {
    title: seedTitle ?? extractTitle(html),
    description: extractDescription(html),
    imageUrl: image && isPublicHttpUrl(image) ? image : null,
  };
}

/**
 * Run the full ingest pipeline for one newsletter: extract → unwrap → canonicalize → dedupe →
 * pre-mark duplicates → (optionally) enrich → persist. Returns the created import with its items.
 */
export async function ingestNewsletter(input: IngestInput): Promise<NewsletterImport> {
  const candidates = filterAndDedupe(extractCandidates(input.content, input.kind));
  const [websites, ignoreList, blacklist] = await Promise.all([
    listWebsites(),
    getShortenerIgnoreList(),
    getNewsletterBlacklist(),
  ]);
  const data = {
    mode: "trackers" as const,
    websites,
    ignoreList,
  };

  const resolvedAll = await mapWithConcurrency(
    candidates,
    FETCH_CONCURRENCY,
    candidate => resolveCandidate(candidate, data),
  );
  // Drop blacklisted links AFTER resolution so tracker-wrapped variants are unwrapped to their real
  // destination first. Blacklisted links are never staged, so they vanish from future scans.
  const resolved = dedupeResolved(
    resolvedAll.filter(item => item.url === null || !isBlacklisted(item.url, blacklist)),
  );

  const flagged = await Promise.all(resolved.map(withDuplicateFlag));

  const enriched = input.enrich
    ? await mapWithConcurrency(flagged, ENRICH_CONCURRENCY, entry => enrichCandidate(entry.item))
    : flagged.map(entry => ({
      title: entry.item.anchorText.trim() || null,
      description: null as string | null,
      imageUrl: null as string | null,
    }));

  const importId = await db.transaction(async (tx) => {
    const [importRow] = await tx
      .insert(newsletterImports)
      .values({
        source: input.source,
        title: input.title ?? null,
        sourceUrl: input.sourceUrl ?? null,
        newsletterId: input.newsletterId ?? null,
        defaultCategoryId: input.defaultCategoryId ?? null,
      })
      .returning({
        id: newsletterImports.id,
      });
    const id = importRow!.id;
    if (flagged.length > 0) {
      await tx.insert(newsletterImportItems).values(
        flagged.map((entry, i) => ({
          importId: id,
          url: entry.item.url,
          rawUrl: entry.item.rawUrl,
          title: enriched[i]!.title,
          description: enriched[i]!.description,
          imageUrl: enriched[i]!.imageUrl,
          anchorText: entry.item.anchorText || null,
          status: entry.item.status,
          duplicateBookmarkId: entry.duplicateBookmarkId,
          errorReason: entry.item.errorReason,
        })),
      );
    }
    return id;
  });

  return (await getNewsletterImport(importId))!;
}

/** Build candidate content for a `.eml`/`.html` upload, returning the HTML (or text) to ingest. */
export function contentFromUpload(
  filename: string,
  bytes: Buffer,
): { content: string;
  kind: "html" | "text"; } | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".eml")) {
    const {
      html, text,
    } = extractEmlHtml(bytes);
    if (html) return {
      content: html,
      kind: "html",
    };
    if (text) return {
      content: text,
      kind: "text",
    };
    return null;
  }
  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    return {
      content: bytes.toString("utf8"),
      kind: "html",
    };
  }
  if (lower.endsWith(".txt")) {
    return {
      content: bytes.toString("utf8"),
      kind: "text",
    };
  }
  return null;
}

function summarize(importRow: NewsletterImportRow, items: NewsletterImportItemRow[]): NewsletterImportSummary {
  const statusCounts = Object.fromEntries(
    STATUS_KEYS.map(key => [key, 0]),
  ) as Record<NewsletterImportItemStatus, number>;
  for (const item of items) {
    const status = item.status as NewsletterImportItemStatus;
    if (status in statusCounts) statusCounts[status] += 1;
  }
  return {
    id: importRow.id,
    source: importRow.source as NewsletterImportSource,
    title: importRow.title,
    sourceUrl: importRow.sourceUrl,
    newsletterId: importRow.newsletterId,
    defaultCategoryId: importRow.defaultCategoryId,
    createdAt: isoOf(importRow.createdAt),
    itemCount: items.length,
    statusCounts,
  };
}

/** List all imports (newest first) with per-status counts, no items. */
export async function listNewsletterImports(): Promise<NewsletterImportSummary[]> {
  const importRows = await db.select().from(newsletterImports);
  const itemRows = await db
    .select({
      importId: newsletterImportItems.importId,
      status: newsletterImportItems.status,
    })
    .from(newsletterImportItems);
  const byImport = new Map<string, { status: string }[]>();
  for (const item of itemRows) {
    const list = byImport.get(item.importId) ?? [];
    list.push({
      status: item.status,
    });
    byImport.set(item.importId, list);
  }
  return importRows
    .map(row => summarize(row, (byImport.get(row.id) ?? []) as NewsletterImportItemRow[]))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

/** List the issues (= imports) belonging to one newsletter, newest first, with per-status counts. */
export async function listNewsletterIssues(newsletterId: string): Promise<NewsletterImportSummary[]> {
  const importRows = await db
    .select()
    .from(newsletterImports)
    .where(eq(newsletterImports.newsletterId, newsletterId));
  if (importRows.length === 0) return [];
  const itemRows = await db
    .select({
      importId: newsletterImportItems.importId,
      status: newsletterImportItems.status,
    })
    .from(newsletterImportItems)
    .where(inArray(newsletterImportItems.importId, importRows.map(r => r.id)));
  const byImport = new Map<string, { status: string }[]>();
  for (const item of itemRows) {
    const list = byImport.get(item.importId) ?? [];
    list.push({
      status: item.status,
    });
    byImport.set(item.importId, list);
  }
  return importRows
    .map(row => summarize(row, (byImport.get(row.id) ?? []) as NewsletterImportItemRow[]))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

/**
 * Manually associate bookmarks with an issue (= import), or disassociate them. `add` points the
 * bookmarks at this import and its newsletter; `remove` clears both (only for bookmarks currently
 * pointing at this import). No condition references a newsletter, so the bookmark evaluation cache is
 * left untouched; the client refetches the bookmark list.
 */
export async function setIssueBookmarks(
  importId: string,
  bookmarkIds: string[],
  op: "add" | "remove",
): Promise<void> {
  if (bookmarkIds.length === 0) return;
  if (op === "remove") {
    await db
      .update(bookmarks)
      .set({
        newsletterImportId: null,
        newsletterId: null,
      })
      .where(and(
        eq(bookmarks.newsletterImportId, importId),
        inArray(bookmarks.id, bookmarkIds),
      ));
    return;
  }
  const [importRow] = await db
    .select({
      newsletterId: newsletterImports.newsletterId,
    })
    .from(newsletterImports)
    .where(eq(newsletterImports.id, importId));
  if (!importRow) return;
  await db
    .update(bookmarks)
    .set({
      newsletterImportId: importId,
      newsletterId: importRow.newsletterId,
    })
    .where(inArray(bookmarks.id, bookmarkIds));
}

/** Fetch one import with its items (oldest item first), or null when not found. */
export async function getNewsletterImport(id: string): Promise<NewsletterImport | null> {
  const [importRow] = await db.select().from(newsletterImports).where(eq(newsletterImports.id, id));
  if (!importRow) return null;
  const itemRows = await db
    .select()
    .from(newsletterImportItems)
    .where(eq(newsletterImportItems.importId, id))
    .orderBy(asc(newsletterImportItems.createdAt));
  return {
    id: importRow.id,
    source: importRow.source as NewsletterImportSource,
    title: importRow.title,
    sourceUrl: importRow.sourceUrl,
    newsletterId: importRow.newsletterId,
    defaultCategoryId: importRow.defaultCategoryId,
    createdAt: isoOf(importRow.createdAt),
    items: itemRows.map(toItem),
  };
}

/** Edit a staged candidate's url/title/description (or un-reject it) before approval. */
export async function updateImportItem(
  itemId: string,
  patch: UpdateNewsletterImportItemInput,
): Promise<NewsletterImportItem | null> {
  const set: Partial<NewsletterImportItemRow> = {};
  if (patch.url !== undefined) set.url = patch.url;
  if (patch.title !== undefined) set.title = patch.title;
  if (patch.description !== undefined) set.description = patch.description;
  if (patch.categoryId !== undefined) set.categoryId = patch.categoryId;
  if (patch.status !== undefined) {
    set.status = patch.status;
    // Re-opening a row clears any prior error/duplicate annotations.
    if (patch.status === "pending") {
      set.errorReason = null;
    }
  }
  if (Object.keys(set).length === 0) {
    const [row] = await db.select().from(newsletterImportItems).where(eq(newsletterImportItems.id, itemId));
    return row ? toItem(row) : null;
  }
  const [row] = await db
    .update(newsletterImportItems)
    .set(set)
    .where(eq(newsletterImportItems.id, itemId))
    .returning();
  return row ? toItem(row) : null;
}

/**
 * Resolve the bookmark fields an import contributes to each approved item: the issue link (always
 * this import) plus, when the import has a newsletter, that newsletter's default category / media
 * type / tags. These ride into `createBookmark` as input fields, so the existing precedence applies
 * (the newsletter's values win over website/channel defaults, matching the user's explicit choice).
 */
async function importBookmarkDefaults(importId: string): Promise<{
  newsletterImportId: string;
  newsletterId: string | null;
  categoryId?: string;
  mediaTypeId?: string | null;
  tagIds?: string[];
}> {
  const [importRow] = await db
    .select({
      newsletterId: newsletterImports.newsletterId,
    })
    .from(newsletterImports)
    .where(eq(newsletterImports.id, importId));
  const newsletterId = importRow?.newsletterId ?? null;
  if (!newsletterId) {
    return {
      newsletterImportId: importId,
      newsletterId: null,
    };
  }
  const [categoryId, mediaTypeId, tagIds] = await Promise.all([
    getNewsletterCategoryId(newsletterId),
    getNewsletterMediaTypeId(newsletterId),
    getNewsletterTagIds(newsletterId),
  ]);
  return {
    newsletterImportId: importId,
    newsletterId,
    ...(categoryId
      ? {
        categoryId,
      }
      : {}),
    mediaTypeId,
    tagIds,
  };
}

/** Approve one staged candidate: create a bookmark from it, mirroring the bulk-URL per-item handling. */
export async function approveImportItem(itemId: string): Promise<NewsletterApproveResult> {
  const [item] = await db.select().from(newsletterImportItems).where(eq(newsletterImportItems.id, itemId));
  if (!item) return {
    itemId,
    status: "skipped",
    message: "Item not found.",
  };
  if (item.status === "approved" && item.createdBookmarkId) {
    return {
      itemId,
      status: "skipped",
      message: "Already approved.",
      bookmarkId: item.createdBookmarkId,
    };
  }
  if (!item.url) {
    await db
      .update(newsletterImportItems)
      .set({
        status: "error",
        errorReason: "No resolvable URL.",
      })
      .where(eq(newsletterImportItems.id, itemId));
    return {
      itemId,
      status: "error",
      message: "No resolvable URL.",
    };
  }

  // The issue link + the selected newsletter's default category / media type / tags.
  const defaults = await importBookmarkDefaults(item.importId);

  // Category precedence: per-item override > import default > newsletter default. `undefined` (none
  // set) preserves createBookmark's website/channel/built-in default precedence.
  let categoryId = item.categoryId ?? undefined;
  if (categoryId === undefined) {
    const [importRow] = await db
      .select({
        defaultCategoryId: newsletterImports.defaultCategoryId,
      })
      .from(newsletterImports)
      .where(eq(newsletterImports.id, item.importId));
    categoryId = importRow?.defaultCategoryId ?? defaults.categoryId ?? undefined;
  }

  try {
    const bookmark = await createBookmark({
      url: item.url,
      title: item.title?.trim() || item.anchorText?.trim() || item.url,
      description: item.description ?? null,
      ...defaults,
      categoryId,
    });
    await db
      .update(newsletterImportItems)
      .set({
        status: "approved",
        createdBookmarkId: bookmark.id,
        errorReason: null,
      })
      .where(eq(newsletterImportItems.id, itemId));
    return {
      itemId,
      status: "approved",
      bookmarkId: bookmark.id,
    };
  }
  catch (err) {
    if (err instanceof DuplicateUrlError) {
      const dup = await checkBookmarkUrlDuplicate(item.url);
      const match = dup.exactMatch ?? dup.pathMatch;
      await db
        .update(newsletterImportItems)
        .set({
          status: "duplicate",
          duplicateBookmarkId: match?.id ?? null,
        })
        .where(eq(newsletterImportItems.id, itemId));
      return {
        itemId,
        status: "duplicate",
        message: err.message,
        bookmarkId: match?.id,
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(newsletterImportItems)
      .set({
        status: "error",
        errorReason: message,
      })
      .where(eq(newsletterImportItems.id, itemId));
    return {
      itemId,
      status: "error",
      message,
    };
  }
}

/** Approve every pending item in an import. Per-item results; one failure never aborts the batch. */
export async function approveImport(importId: string): Promise<NewsletterApproveResult[]> {
  const items = await db
    .select({
      id: newsletterImportItems.id,
    })
    .from(newsletterImportItems)
    .where(eq(newsletterImportItems.importId, importId))
    .orderBy(asc(newsletterImportItems.createdAt));
  const results: NewsletterApproveResult[] = [];
  // Sequential: createBookmark auto-creates websites, so concurrent creates could race on the same host.
  for (const item of items) {
    results.push(await approveImportItem(item.id));
  }
  return results;
}

/** Mark a staged candidate as rejected. */
export async function rejectImportItem(itemId: string): Promise<boolean> {
  const rows = await db
    .update(newsletterImportItems)
    .set({
      status: "rejected",
    })
    .where(eq(newsletterImportItems.id, itemId))
    .returning({
      id: newsletterImportItems.id,
    });
  return rows.length > 0;
}

/** Delete an import and its items (cascade). */
export async function deleteNewsletterImport(id: string): Promise<boolean> {
  const rows = await db
    .delete(newsletterImports)
    .where(eq(newsletterImports.id, id))
    .returning({
      id: newsletterImports.id,
    });
  return rows.length > 0;
}
