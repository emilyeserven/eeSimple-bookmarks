/**
 * Import orchestration: turn raw content (a pasted/fetched/uploaded newsletter today; other link
 * sources such as listicles later) into a reviewable Inbox queue of candidate bookmarks, and
 * approve/reject/block/edit those candidates. The pure extraction lives in `newsletterIngest.ts` and
 * the redirect resolution in `redirectUnwrap.ts`; this module wires them to the DB and, on approval,
 * to `createBookmark`.
 *
 * Staging rows are NOT matchable bookmark data, so writes here never call `invalidateBookmarkCache`.
 * Only `createBookmark` (invoked on approve) touches the cache, which it already does internally.
 */

import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import type {
  ImportApproveResult,
  ImportBlacklistEntry,
  ImportItem,
  ImportItemStatus,
  ImportSource,
  ImportSummary,
  InboxItem,
  Import as ImportRecord,
  PurgeImportItemsResult,
  UpdateImportItemInput,
} from "@eesimple/types";
import { canonicalize, isBlacklisted } from "@eesimple/types";
import { db } from "@/db";
import {
  bookmarks,
  type ImportItemRow,
  importItems,
  imports,
  type ImportRow,
  newsletters,
} from "@/db/schema";
import { addImportBlacklistEntry, getImportBlacklist, getShortenerIgnoreList } from "@/services/appSettings";
import { checkBookmarkUrlDuplicate, createBookmark, DuplicateUrlError } from "@/services/bookmarks";
import {
  extractCandidates,
  extractEmlHtml,
  filterAndDedupe,
  isAssetUrl,
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

const STATUS_KEYS: ImportItemStatus[] = [
  "pending",
  "approved",
  "rejected",
  "duplicate",
  "error",
  "blocked",
];

/** What `ingestImport` needs, regardless of which entry point produced it. */
export interface IngestInput {
  source: ImportSource;
  /** Raw content (HTML or text). For `.eml` the caller extracts the HTML first. */
  content: string;
  kind: "html" | "text" | "auto";
  /** Explicit/parsed import label (e.g. a provided title or an `.eml` Subject); wins over parsing. */
  title?: string | null;
  /** Fallback label (source URL / filename) used only when no title is provided or parsed. */
  titleFallback?: string | null;
  sourceUrl?: string | null;
  /** The newsletter (publication) this import belongs to, or `null`. */
  newsletterId?: string | null;
  /** Default category applied to every link approved from this import. */
  defaultCategoryId?: string | null;
}

function isoOf(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function toItem(row: ImportItemRow): ImportItem {
  return {
    id: row.id,
    importId: row.importId,
    url: row.url,
    rawUrl: row.rawUrl,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    newsletterContext: row.newsletterContext,
    anchorText: row.anchorText,
    categoryId: row.categoryId,
    status: row.status as ImportItemStatus,
    markedForDeletion: row.markedForDeletion,
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
  status: ImportItemStatus;
  errorReason: string | null;
  /** The surrounding source passage (paragraph + nearest heading), carried from extraction. */
  context: string | null;
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
      context: candidate.context,
    };
  }
  const destination = result.kind === "ok" ? result.finalUrl : candidate.rawUrl;
  return {
    rawUrl: candidate.rawUrl,
    anchorText: candidate.anchorText,
    url: canonicalize(destination, data).url,
    status: "pending",
    errorReason: null,
    context: candidate.context,
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
    else {
      byUrl.set(item.url, {
        ...existing,
        anchorText: item.anchorText.length > existing.anchorText.length ? item.anchorText : existing.anchorText,
        context: existing.context ?? item.context,
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
    // Prefer the fetched page title (og:title/<title>); fall back to the source anchor text.
    title: extractTitle(html) ?? seedTitle,
    description: extractDescription(html),
    imageUrl: image && isPublicHttpUrl(image) ? image : null,
  };
}

/**
 * Run the full ingest pipeline for one import: extract → unwrap → canonicalize → dedupe →
 * pre-mark duplicates → enrich → persist. Returns the created import with its items.
 */
export async function ingestImport(input: IngestInput): Promise<ImportRecord> {
  const candidates = filterAndDedupe(extractCandidates(input.content, input.kind));
  const [websites, ignoreList, blacklist] = await Promise.all([
    listWebsites(),
    getShortenerIgnoreList(),
    getImportBlacklist(),
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
  // Drop blacklisted links AND static-asset destinations (font/image files) AFTER resolution, so a
  // tracker-wrapped link is unwrapped to its real target first — the wrapper's path never ends in
  // `.woff`/`.png`, only the destination does. Dropped links are never staged, so they vanish from
  // future imports.
  const resolved = dedupeResolved(
    resolvedAll.filter(
      item => item.url === null || (!isBlacklisted(item.url, blacklist) && !isAssetUrl(item.url)),
    ),
  );

  const flagged = await Promise.all(resolved.map(withDuplicateFlag));

  // Always enrich: fetch each candidate's title/description/preview so the review queue and the
  // created bookmarks have them without an opt-in step.
  const enriched = await mapWithConcurrency(
    flagged,
    ENRICH_CONCURRENCY,
    entry => enrichCandidate(entry.item),
  );

  // Import label: an explicit/parsed title wins, then a title parsed from the source HTML
  // (og:title/<title>), then the URL/filename fallback.
  const parsedTitle = input.title == null && input.kind !== "text" ? extractTitle(input.content) : null;
  const title = input.title ?? parsedTitle ?? input.titleFallback ?? null;

  const importId = await db.transaction(async (tx) => {
    const [importRow] = await tx
      .insert(imports)
      .values({
        source: input.source,
        title,
        sourceUrl: input.sourceUrl ?? null,
        newsletterId: input.newsletterId ?? null,
        defaultCategoryId: input.defaultCategoryId ?? null,
      })
      .returning({
        id: imports.id,
      });
    const id = importRow!.id;
    if (flagged.length > 0) {
      await tx.insert(importItems).values(
        flagged.map((entry, i) => ({
          importId: id,
          url: entry.item.url,
          rawUrl: entry.item.rawUrl,
          title: enriched[i]!.title,
          description: enriched[i]!.description,
          imageUrl: enriched[i]!.imageUrl,
          newsletterContext: entry.item.context,
          anchorText: entry.item.anchorText || null,
          status: entry.item.status,
          duplicateBookmarkId: entry.duplicateBookmarkId,
          errorReason: entry.item.errorReason,
        })),
      );
    }
    return id;
  });

  return (await getImport(importId))!;
}

/**
 * Build candidate content for a `.eml`/`.html` upload, returning the HTML (or text) to ingest plus a
 * parsed title (the `.eml` Subject) when available — used as the import label.
 */
export function contentFromUpload(
  filename: string,
  bytes: Buffer,
): { content: string;
  kind: "html" | "text";
  title: string | null; } | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".eml")) {
    const {
      html, text, subject,
    } = extractEmlHtml(bytes);
    if (html) return {
      content: html,
      kind: "html",
      title: subject,
    };
    if (text) return {
      content: text,
      kind: "text",
      title: subject,
    };
    return null;
  }
  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    return {
      content: bytes.toString("utf8"),
      kind: "html",
      title: null,
    };
  }
  if (lower.endsWith(".txt")) {
    return {
      content: bytes.toString("utf8"),
      kind: "text",
      title: null,
    };
  }
  return null;
}

function summarize(importRow: ImportRow, items: ImportItemRow[]): ImportSummary {
  const statusCounts = Object.fromEntries(
    STATUS_KEYS.map(key => [key, 0]),
  ) as Record<ImportItemStatus, number>;
  for (const item of items) {
    const status = item.status as ImportItemStatus;
    if (status in statusCounts) statusCounts[status] += 1;
  }
  return {
    id: importRow.id,
    source: importRow.source as ImportSource,
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
export async function listImports(): Promise<ImportSummary[]> {
  const importRows = await db.select().from(imports);
  const itemRows = await db
    .select({
      importId: importItems.importId,
      status: importItems.status,
    })
    .from(importItems);
  const byImport = new Map<string, { status: string }[]>();
  for (const item of itemRows) {
    const list = byImport.get(item.importId) ?? [];
    list.push({
      status: item.status,
    });
    byImport.set(item.importId, list);
  }
  return importRows
    .map(row => summarize(row, (byImport.get(row.id) ?? []) as ImportItemRow[]))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

/**
 * List every import item across all imports (newest first), each enriched with its parent import's
 * source context. Powers the global Inbox review queue.
 */
export async function listInboxItems(): Promise<InboxItem[]> {
  const rows = await db
    .select({
      item: importItems,
      importSource: imports.source,
      importTitle: imports.title,
      importSourceUrl: imports.sourceUrl,
      newsletterName: newsletters.name,
    })
    .from(importItems)
    .innerJoin(imports, eq(importItems.importId, imports.id))
    .leftJoin(newsletters, eq(imports.newsletterId, newsletters.id))
    .orderBy(desc(importItems.createdAt));
  return rows.map(row => ({
    ...toItem(row.item),
    importSource: row.importSource as ImportSource,
    sourceLabel: row.newsletterName ?? row.importTitle ?? row.importSourceUrl ?? null,
  }));
}

/** List the issues (= imports) belonging to one newsletter, newest first, with per-status counts. */
export async function listNewsletterIssues(newsletterId: string): Promise<ImportSummary[]> {
  const importRows = await db
    .select()
    .from(imports)
    .where(eq(imports.newsletterId, newsletterId));
  if (importRows.length === 0) return [];
  const itemRows = await db
    .select({
      importId: importItems.importId,
      status: importItems.status,
    })
    .from(importItems)
    .where(inArray(importItems.importId, importRows.map(r => r.id)));
  const byImport = new Map<string, { status: string }[]>();
  for (const item of itemRows) {
    const list = byImport.get(item.importId) ?? [];
    list.push({
      status: item.status,
    });
    byImport.set(item.importId, list);
  }
  return importRows
    .map(row => summarize(row, (byImport.get(row.id) ?? []) as ImportItemRow[]))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

/**
 * Manually associate bookmarks with an import, or disassociate them. `add` points the bookmarks at
 * this import and its newsletter; `remove` clears both (only for bookmarks currently pointing at this
 * import). No condition references a newsletter, so the bookmark evaluation cache is left untouched;
 * the client refetches the bookmark list.
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
        importId: null,
        newsletterId: null,
      })
      .where(and(
        eq(bookmarks.importId, importId),
        inArray(bookmarks.id, bookmarkIds),
      ));
    return;
  }
  const [importRow] = await db
    .select({
      newsletterId: imports.newsletterId,
    })
    .from(imports)
    .where(eq(imports.id, importId));
  if (!importRow) return;
  await db
    .update(bookmarks)
    .set({
      importId,
      newsletterId: importRow.newsletterId,
    })
    .where(inArray(bookmarks.id, bookmarkIds));
}

/** Fetch one import with its items (oldest item first), or null when not found. */
export async function getImport(id: string): Promise<ImportRecord | null> {
  const [importRow] = await db.select().from(imports).where(eq(imports.id, id));
  if (!importRow) return null;
  const itemRows = await db
    .select()
    .from(importItems)
    .where(eq(importItems.importId, id))
    .orderBy(asc(importItems.createdAt));
  return {
    id: importRow.id,
    source: importRow.source as ImportSource,
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
  patch: UpdateImportItemInput,
): Promise<ImportItem | null> {
  const set: Partial<ImportItemRow> = {};
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
    const [row] = await db.select().from(importItems).where(eq(importItems.id, itemId));
    return row ? toItem(row) : null;
  }
  const [row] = await db
    .update(importItems)
    .set(set)
    .where(eq(importItems.id, itemId))
    .returning();
  return row ? toItem(row) : null;
}

/**
 * Resolve the bookmark fields an import contributes to each approved item: the import link (always
 * this import) plus, when the import has a newsletter, that newsletter's default category / media
 * type / tags. These ride into `createBookmark` as input fields, so the existing precedence applies
 * (the newsletter's values win over website/channel defaults, matching the user's explicit choice).
 */
async function importBookmarkDefaults(importId: string): Promise<{
  importId: string;
  newsletterId: string | null;
  categoryId?: string;
  mediaTypeId?: string | null;
  tagIds?: string[];
}> {
  const [importRow] = await db
    .select({
      newsletterId: imports.newsletterId,
    })
    .from(imports)
    .where(eq(imports.id, importId));
  const newsletterId = importRow?.newsletterId ?? null;
  if (!newsletterId) {
    return {
      importId,
      newsletterId: null,
    };
  }
  const [categoryId, mediaTypeId, tagIds] = await Promise.all([
    getNewsletterCategoryId(newsletterId),
    getNewsletterMediaTypeId(newsletterId),
    getNewsletterTagIds(newsletterId),
  ]);
  return {
    importId,
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

/**
 * Approve one staged candidate: create a bookmark from it, then flag the item for deletion (the
 * bookmark now carries the link). The source passage (newsletter context) is saved as the bookmark's
 * description so the surrounding context survives; the item's own description is the fallback.
 */
export async function approveImportItem(itemId: string): Promise<ImportApproveResult> {
  const [item] = await db.select().from(importItems).where(eq(importItems.id, itemId));
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
      .update(importItems)
      .set({
        status: "error",
        errorReason: "No resolvable URL.",
      })
      .where(eq(importItems.id, itemId));
    return {
      itemId,
      status: "error",
      message: "No resolvable URL.",
    };
  }

  // The import link + the selected newsletter's default category / media type / tags.
  const defaults = await importBookmarkDefaults(item.importId);

  // Category precedence: per-item override > import default > newsletter default. `undefined` (none
  // set) preserves createBookmark's website/channel/built-in default precedence.
  let categoryId = item.categoryId ?? undefined;
  if (categoryId === undefined) {
    const [importRow] = await db
      .select({
        defaultCategoryId: imports.defaultCategoryId,
      })
      .from(imports)
      .where(eq(imports.id, item.importId));
    categoryId = importRow?.defaultCategoryId ?? defaults.categoryId ?? undefined;
  }

  try {
    const bookmark = await createBookmark({
      url: item.url,
      title: item.title?.trim() || item.anchorText?.trim() || item.url,
      // Save the source passage (newsletter context) as the description; fall back to the item's own.
      description: item.newsletterContext ?? item.description ?? null,
      ...defaults,
      newsletterContext: item.newsletterContext ?? null,
      categoryId,
    });
    await db
      .update(importItems)
      .set({
        status: "approved",
        createdBookmarkId: bookmark.id,
        errorReason: null,
        // The bookmark exists now, so flag the staged item for the Import Settings purge.
        markedForDeletion: true,
      })
      .where(eq(importItems.id, itemId));
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
        .update(importItems)
        .set({
          status: "duplicate",
          duplicateBookmarkId: match?.id ?? null,
        })
        .where(eq(importItems.id, itemId));
      return {
        itemId,
        status: "duplicate",
        message: err.message,
        bookmarkId: match?.id,
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(importItems)
      .set({
        status: "error",
        errorReason: message,
      })
      .where(eq(importItems.id, itemId));
    return {
      itemId,
      status: "error",
      message,
    };
  }
}

/** Approve every pending item in an import. Per-item results; one failure never aborts the batch. */
export async function approveImport(importId: string): Promise<ImportApproveResult[]> {
  const items = await db
    .select({
      id: importItems.id,
    })
    .from(importItems)
    .where(eq(importItems.importId, importId))
    .orderBy(asc(importItems.createdAt));
  const results: ImportApproveResult[] = [];
  // Sequential: createBookmark auto-creates websites, so concurrent creates could race on the same host.
  for (const item of items) {
    results.push(await approveImportItem(item.id));
  }
  return results;
}

/** Mark a staged candidate as rejected. */
export async function rejectImportItem(itemId: string): Promise<boolean> {
  const rows = await db
    .update(importItems)
    .set({
      status: "rejected",
    })
    .where(eq(importItems.id, itemId))
    .returning({
      id: importItems.id,
    });
  return rows.length > 0;
}

/**
 * Block a staged candidate: add its URL pattern to the Imports Blacklist (so future imports skip it)
 * and mark the item `blocked`. The Import Settings purge later sweeps blocked items, but the blacklist
 * entry is kept. Returns the updated item, or null when the item was not found.
 */
export async function blockImportItem(
  itemId: string,
  entry: ImportBlacklistEntry,
): Promise<ImportItem | null> {
  const [item] = await db.select().from(importItems).where(eq(importItems.id, itemId));
  if (!item) return null;
  await addImportBlacklistEntry(entry);
  const [row] = await db
    .update(importItems)
    .set({
      status: "blocked",
    })
    .where(eq(importItems.id, itemId))
    .returning();
  return row ? toItem(row) : null;
}

/** Delete an import and its items (cascade). */
export async function deleteImport(id: string): Promise<boolean> {
  const rows = await db
    .delete(imports)
    .where(eq(imports.id, id))
    .returning({
      id: imports.id,
    });
  return rows.length > 0;
}

/**
 * Purge processed items: delete every import item flagged for deletion (a bookmark was created from
 * it) or `blocked`. The Imports Blacklist is intentionally left untouched, so blocked links stay
 * skipped on future imports. Returns the number of rows deleted.
 */
export async function purgeProcessedItems(): Promise<PurgeImportItemsResult> {
  const rows = await db
    .delete(importItems)
    .where(or(eq(importItems.markedForDeletion, true), eq(importItems.status, "blocked")))
    .returning({
      id: importItems.id,
    });
  return {
    deleted: rows.length,
  };
}
