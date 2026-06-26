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

import { and, asc, count, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import type {
  ActiveImport,
  ImportApproveResult,
  ImportBlacklistEntry,
  ImportItem,
  ImportItemStatus,
  ImportSource,
  ImportStatus,
  ImportSummary,
  InboxItem,
  InboxPreFillDefaults,
  Import as ImportRecord,
  OrphanDeleteResult,
  PurgeImportItemsResult,
  RecheckPendingItemsResult,
  RejectPendingItemsResult,
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
import { addImportBlacklistEntry, getCustomStripParams, getImportBlacklist, getRedirectIgnoreList, getShortenerIgnoreList } from "@/services/appSettings";
import { applyImportRules } from "@/services/importRules";
import { approvalTitle, mergeApprovalPropertyValues, mergeApprovalTagIds } from "@/services/importApproval";
import { suggestAutofillForBookmark } from "@/services/autofill";
import { checkBookmarkUrlDuplicate, createBookmark, DuplicateUrlError } from "@/services/bookmarks";
import { enqueueImportJob } from "@/services/importQueue";
import {
  extractArticleBody,
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
  fetchBodyHtmlResult,
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

/** What the ingest pipeline needs, regardless of which entry point produced it. */
export interface IngestInput {
  source: ImportSource;
  /** Raw content (HTML or text). For `.eml` the caller extracts the HTML first. Empty for `url`
   * imports until the worker fetches `fetchUrl`. */
  content: string;
  /** For `source === "url"`: the public page to fetch in the background worker (off the request path). */
  fetchUrl?: string | null;
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

/** True when `url`'s hostname (minus leading www.) matches any entry in `ignoreList`. */
function isRedirectIgnored(url: string, ignoreList: string[]): boolean {
  if (ignoreList.length === 0) return false;
  try {
    const hostname = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    return ignoreList.some(d => hostname === d || hostname.endsWith(`.${d}`));
  }
  catch {
    return false;
  }
}

/** Unwrap a candidate's tracker URL and canonicalize the destination. Falls back to the raw URL on a
 * non-security failure so a slow/blocking article server doesn't drop the link; only an SSRF block
 * marks the row as an error. Skips unwrapping if the URL's domain is in `redirectIgnoreList`. */
async function resolveCandidate(
  candidate: LinkCandidate,
  data: { mode: "trackers";
    websites: Awaited<ReturnType<typeof listWebsites>>;
    ignoreList: string[];
    redirectIgnoreList: string[];
    customStripParams: string[]; },
): Promise<ResolvedCandidate> {
  if (isRedirectIgnored(candidate.rawUrl, data.redirectIgnoreList)) {
    return {
      rawUrl: candidate.rawUrl,
      anchorText: candidate.anchorText,
      url: canonicalize(candidate.rawUrl, data).url,
      status: "pending",
      errorReason: null,
      context: candidate.context,
    };
  }
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

/** How often (every Nth enriched link) the worker flushes `processedCount` to the DB. */
const PROGRESS_FLUSH_EVERY = 3;

/** Mark an import as failed with a human-readable reason (best-effort; never throws). */
async function markImportFailed(importId: string, reason: string): Promise<void> {
  await db
    .update(imports)
    .set({
      status: "failed",
      errorReason: reason,
    })
    .where(eq(imports.id, importId));
}

/**
 * Create the `imports` row immediately with `status === "queued"` and no items, returning the queued
 * record so the request can respond instantly. The links are extracted later by `processImport` on
 * the background queue (see `queueImport`).
 */
export async function createQueuedImport(input: IngestInput): Promise<ImportRecord> {
  // Provisional label: an explicit/parsed title, then a title parsed from any content we already have
  // (paste/upload), then the URL/filename fallback. `url` imports refine this once the page is fetched.
  const parsedTitle = input.title == null && input.kind !== "text" && input.content
    ? extractTitle(input.content)
    : null;
  const title = input.title ?? parsedTitle ?? input.titleFallback ?? null;
  const [importRow] = await db
    .insert(imports)
    .values({
      source: input.source,
      title,
      sourceUrl: input.sourceUrl ?? null,
      newsletterId: input.newsletterId ?? null,
      defaultCategoryId: input.defaultCategoryId ?? null,
      status: "queued",
    })
    .returning({
      id: imports.id,
    });
  return (await getImport(importRow!.id))!;
}

/**
 * Run the full ingest pipeline for one queued import: (fetch for `url`) → extract → unwrap →
 * canonicalize → dedupe → pre-mark duplicates → enrich → persist, advancing the import's
 * `status`/`totalCount`/`processedCount` as it goes. Records its own failure (`status === "failed"`)
 * rather than throwing — it runs detached on the background queue.
 */
export async function processImport(importId: string, input: IngestInput): Promise<void> {
  try {
    await db
      .update(imports)
      .set({
        status: "processing",
      })
      .where(eq(imports.id, importId));

    // For a `url` import, fetch the page now — off the request path — so a slow/blocking server never
    // holds the user's submit open.
    let content = input.content;
    if (input.source === "url" && input.fetchUrl) {
      const result = await fetchBodyHtmlResult(input.fetchUrl, /<\/body>/i);
      if (result.kind !== "ok") {
        await markImportFailed(importId, `Could not fetch that page (${result.kind}).`);
        return;
      }
      content = result.html;
      // Now that we have the page, refine the import label from its <title>/og:title.
      const refined = input.title ?? extractTitle(content) ?? input.titleFallback ?? null;
      if (refined) {
        await db.update(imports).set({
          title: refined,
        }).where(eq(imports.id, importId));
      }
    }

    // Scope link extraction to the main article body when present (a full webpage), so site
    // nav/sidebar/footer/related-posts links are dropped; fall back to the whole document when no
    // article region is found (a newsletter email — unchanged behavior).
    const scoped = input.kind !== "text" ? (extractArticleBody(content) ?? content) : content;
    const candidates = filterAndDedupe(extractCandidates(scoped, input.kind));
    await db
      .update(imports)
      .set({
        totalCount: candidates.length,
        processedCount: 0,
      })
      .where(eq(imports.id, importId));

    const [websites, ignoreList, redirectIgnoreList, blacklist, customStripParams] = await Promise.all([
      listWebsites(),
      getShortenerIgnoreList(),
      getRedirectIgnoreList(),
      getImportBlacklist(),
      getCustomStripParams(),
    ]);
    const data = {
      mode: "trackers" as const,
      websites,
      ignoreList,
      redirectIgnoreList,
      customStripParams,
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
    // Refine the progress denominator to the real number of items now that dedupe/filtering is done.
    await db
      .update(imports)
      .set({
        totalCount: flagged.length,
      })
      .where(eq(imports.id, importId));

    // Always enrich: fetch each candidate's title/description/preview so the review queue and the
    // created bookmarks have them without an opt-in step. Advance `processedCount` as we go (throttled).
    let processed = 0;
    const enriched = await mapWithConcurrency(
      flagged,
      ENRICH_CONCURRENCY,
      async (entry) => {
        const out = await enrichCandidate(entry.item);
        processed += 1;
        if (processed === flagged.length || processed % PROGRESS_FLUSH_EVERY === 0) {
          // Best-effort progress write — a transient failure here must not fail the whole import
          // (the final count is set authoritatively in the persist transaction below).
          try {
            await db.update(imports).set({
              processedCount: processed,
            }).where(eq(imports.id, importId));
          }
          catch {
            // Ignore; progress is advisory.
          }
        }
        return out;
      },
    );

    // Evaluate import rules for each pending item (non-pending items keep their existing status).
    const ruleActions = await Promise.all(
      flagged.map((entry, i) => {
        if (entry.item.status !== "pending" || entry.item.url === null) return Promise.resolve(null);
        return applyImportRules({
          url: entry.item.url,
          title: enriched[i]!.title,
        });
      }),
    );

    const toApproveIds: string[] = [];
    const toBlockUrls: string[] = [];

    await db.transaction(async (tx) => {
      if (flagged.length > 0) {
        const inserted = await tx.insert(importItems).values(
          flagged.map((entry, i) => {
            const action = ruleActions[i];
            let status = entry.item.status;
            if (status === "pending") {
              if (action === "reject") status = "rejected";
              else if (action === "block") status = "blocked";
              // action === "approve" → keep pending; approveImportItem runs after the transaction
            }
            return {
              importId,
              url: entry.item.url,
              rawUrl: entry.item.rawUrl,
              title: enriched[i]!.title,
              description: enriched[i]!.description,
              imageUrl: enriched[i]!.imageUrl,
              newsletterContext: entry.item.context,
              anchorText: entry.item.anchorText || null,
              status,
              duplicateBookmarkId: entry.duplicateBookmarkId,
              errorReason: entry.item.errorReason,
            };
          }),
        ).returning({
          id: importItems.id,
        });

        for (let i = 0; i < flagged.length; i++) {
          const action = ruleActions[i];
          const entry = flagged[i]!;
          if (entry.item.status !== "pending") continue;
          if (action === "block" && entry.item.url !== null) toBlockUrls.push(entry.item.url);
          else if (action === "approve") {
            const row = inserted[i];
            if (row) toApproveIds.push(row.id);
          }
        }
      }
      await tx
        .update(imports)
        .set({
          status: "complete",
          processedCount: flagged.length,
        })
        .where(eq(imports.id, importId));
    });

    // Post-transaction: add domain-level blacklist entries for rule-blocked URLs.
    for (const url of toBlockUrls) {
      try {
        const host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
        await addImportBlacklistEntry({
          kind: "domain",
          value: host,
        });
      }
      catch {
        // Unparseable URL — skip blacklist entry.
      }
    }

    // Post-transaction: auto-approve matched items. One failure must not abort the rest.
    for (const id of toApproveIds) {
      try {
        await approveImportItem(id);
      }
      catch {
        // Approval failures are non-fatal; the item stays pending for manual review.
      }
    }
  }
  catch (err) {
    await markImportFailed(importId, err instanceof Error ? err.message : String(err));
  }
}

/**
 * Create a queued import and enqueue its background processing, returning the queued record at once.
 * The route responds immediately; the Inbox fills as the worker (`processImport`) runs. This is the
 * single entry point the ingest routes call.
 */
export async function queueImport(input: IngestInput): Promise<ImportRecord> {
  const record = await createQueuedImport(input);
  enqueueImportJob(() => processImport(record.id, input));
  return record;
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

function summarize(importRow: ImportRow, items: { status: string;
  url?: string | null; }[]): ImportSummary {
  const statusCounts = Object.fromEntries(
    STATUS_KEYS.map(key => [key, 0]),
  ) as Record<ImportItemStatus, number>;
  for (const item of items) {
    const status = item.status as ImportItemStatus;
    if (status in statusCounts) statusCounts[status] += 1;
  }
  const pendingUrls = items
    .filter(i => i.status === "pending" && i.url != null)
    .map(i => i.url!);
  return {
    id: importRow.id,
    source: importRow.source as ImportSource,
    title: importRow.title,
    sourceUrl: importRow.sourceUrl,
    newsletterId: importRow.newsletterId,
    defaultCategoryId: importRow.defaultCategoryId,
    createdAt: isoOf(importRow.createdAt),
    status: importRow.status as ImportStatus | null,
    totalCount: importRow.totalCount,
    processedCount: importRow.processedCount,
    errorReason: importRow.errorReason,
    itemCount: items.length,
    statusCounts,
    allowedUrls: importRow.allowedUrls ?? [],
    blockedUrls: importRow.blockedUrls ?? [],
    rejectedUrls: importRow.rejectedUrls ?? [],
    pendingUrls,
  };
}

/**
 * Group `{ importId, status }` item rows under their parent import and produce one sorted
 * (newest-first) {@link ImportSummary} per import. Shared by {@link listImports} and
 * {@link listNewsletterIssues}, which differ only in how they fetch the rows.
 */
function summarizeImportsWithItems(
  importRows: ImportRow[],
  itemRows: { importId: string;
    status: string;
    url: string | null; }[],
): ImportSummary[] {
  const byImport = new Map<string, { status: string;
    url: string | null; }[]>();
  for (const item of itemRows) {
    const list = byImport.get(item.importId) ?? [];
    list.push({
      status: item.status,
      url: item.url,
    });
    byImport.set(item.importId, list);
  }
  return importRows
    .map(row => summarize(row, byImport.get(row.id) ?? []))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

/** List all imports (newest first) with per-status counts, no items. */
export async function listImports(): Promise<ImportSummary[]> {
  const importRows = await db.select().from(imports);
  const itemRows = await db
    .select({
      importId: importItems.importId,
      status: importItems.status,
      url: importItems.url,
    })
    .from(importItems);
  return summarizeImportsWithItems(importRows, itemRows);
}

/**
 * List the imports currently in flight (`queued`/`processing`), newest first, with live progress.
 * Powers the header progress indicator, which polls this endpoint while any import is active.
 */
export async function listActiveImports(): Promise<ActiveImport[]> {
  const rows = await db
    .select({
      id: imports.id,
      source: imports.source,
      title: imports.title,
      sourceUrl: imports.sourceUrl,
      status: imports.status,
      totalCount: imports.totalCount,
      processedCount: imports.processedCount,
      newsletterName: newsletters.name,
    })
    .from(imports)
    .leftJoin(newsletters, eq(imports.newsletterId, newsletters.id))
    .where(inArray(imports.status, ["queued", "processing"]))
    .orderBy(desc(imports.createdAt));
  return rows.map(row => ({
    id: row.id,
    source: row.source as ImportSource,
    sourceLabel: row.newsletterName ?? row.title ?? row.sourceUrl ?? null,
    status: row.status as ImportStatus,
    totalCount: row.totalCount,
    processedCount: row.processedCount,
  }));
}

/**
 * Mark any import left `queued`/`processing` as `failed` on boot — a restart abandons the in-process
 * worker, so those rows can never finish on their own. Idempotent; safe to run every boot.
 */
export async function resetStalledImports(): Promise<number> {
  const rows = await db
    .update(imports)
    .set({
      status: "failed",
      errorReason: "Import interrupted by a server restart.",
    })
    .where(inArray(imports.status, ["queued", "processing"]))
    .returning({
      id: imports.id,
    });
  return rows.length;
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
    // Tiebreak on the (unique) id so a batch of items sharing one createdAt keeps a stable order;
    // without it, re-querying after an interaction reshuffles the tied rows unpredictably.
    .orderBy(desc(importItems.createdAt), desc(importItems.id));
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
      url: importItems.url,
    })
    .from(importItems)
    .where(inArray(importItems.importId, importRows.map(r => r.id)));
  return summarizeImportsWithItems(importRows, itemRows);
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
  const pendingUrls = itemRows
    .filter(r => r.status === "pending" && r.url != null)
    .map(r => r.url!);
  return {
    id: importRow.id,
    source: importRow.source as ImportSource,
    title: importRow.title,
    sourceUrl: importRow.sourceUrl,
    newsletterId: importRow.newsletterId,
    defaultCategoryId: importRow.defaultCategoryId,
    createdAt: isoOf(importRow.createdAt),
    status: importRow.status as ImportStatus | null,
    totalCount: importRow.totalCount,
    processedCount: importRow.processedCount,
    errorReason: importRow.errorReason,
    allowedUrls: importRow.allowedUrls ?? [],
    blockedUrls: importRow.blockedUrls ?? [],
    rejectedUrls: importRow.rejectedUrls ?? [],
    pendingUrls,
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
export async function approveImportItem(itemId: string, preFill?: InboxPreFillDefaults): Promise<ImportApproveResult> {
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

  // Evaluate autofill rules against the URL and title (same fields available at creation time on
  // the client form) so approved items pick up the same tags/category/values the form would apply.
  const title = approvalTitle({
    title: item.title,
    anchorText: item.anchorText,
    url: item.url,
  });
  const autofill = await suggestAutofillForBookmark({
    url: item.url,
    title,
  });

  // Category precedence: per-item override > preFill > import default > newsletter default > autofill.
  // `undefined` (none set) preserves createBookmark's website/channel/built-in default precedence.
  let categoryId = item.categoryId ?? undefined;
  if (categoryId === undefined) {
    const [importRow] = await db
      .select({
        defaultCategoryId: imports.defaultCategoryId,
      })
      .from(imports)
      .where(eq(imports.id, item.importId));
    categoryId = preFill?.categoryId ?? importRow?.defaultCategoryId ?? defaults.categoryId ?? autofill.categoryId ?? undefined;
  }

  // Merge pre-fill custom property values with autofill values: autofill wins for any property it
  // already sets; pre-fill fills in the rest.
  const {
    numberValues: mergedNumberValues,
    booleanValues: mergedBooleanValues,
    dateTimeValues: mergedDateTimeValues,
  } = mergeApprovalPropertyValues(autofill, preFill);

  try {
    const bookmark = await createBookmark({
      url: item.url,
      title,
      // Save the source passage (newsletter context) as the description; fall back to the item's own.
      description: item.newsletterContext ?? item.description ?? null,
      ...defaults,
      tagIds: mergeApprovalTagIds(defaults.tagIds, preFill?.tagIds, autofill.tagIds),
      mediaTypeId: preFill?.mediaTypeId ?? defaults.mediaTypeId ?? autofill.mediaTypeId,
      authorIds: preFill?.authorIds,
      publisherId: preFill?.publisherId ?? undefined,
      numberValues: mergedNumberValues.length > 0 ? mergedNumberValues : undefined,
      booleanValues: mergedBooleanValues.length > 0 ? mergedBooleanValues : undefined,
      dateTimeValues: mergedDateTimeValues.length > 0 ? mergedDateTimeValues : undefined,
      choicesValues: preFill?.choicesValues,
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
    // Persist the approved URL on the parent import so the list survives item purges.
    await db
      .update(imports)
      .set({
        allowedUrls: sql`array_append(COALESCE(${imports.allowedUrls}, ARRAY[]::text[]), ${item.url})`,
      })
      .where(eq(imports.id, item.importId));
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
      url: importItems.url,
      importId: importItems.importId,
    });
  if (rows.length === 0) return false;
  const [row] = rows;
  if (row.url) {
    await db
      .update(imports)
      .set({
        rejectedUrls: sql`array_append(COALESCE(${imports.rejectedUrls}, ARRAY[]::text[]), ${row.url})`,
      })
      .where(eq(imports.id, row.importId));
  }
  return true;
}

/** Restore a rejected candidate to `pending` so it can be reviewed again. No-op on other statuses. */
export async function unrejectImportItem(itemId: string): Promise<boolean> {
  const rows = await db
    .update(importItems)
    .set({
      status: "pending",
    })
    .where(and(eq(importItems.id, itemId), eq(importItems.status, "rejected")))
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
  if (row && item.url) {
    await db
      .update(imports)
      .set({
        blockedUrls: sql`array_append(COALESCE(${imports.blockedUrls}, ARRAY[]::text[]), ${item.url})`,
      })
      .where(eq(imports.id, item.importId));
  }
  return row ? toItem(row) : null;
}

/**
 * Append a batch of `{ importId, url }` pairs to one of the three URL-list columns on the parent
 * import rows. Groups by `importId` so each import gets one update instead of one per URL.
 */
async function appendUrlsToImports(
  pairs: { importId: string;
    url: string; }[],
  column: "allowedUrls" | "blockedUrls" | "rejectedUrls",
): Promise<void> {
  const byImport = new Map<string, string[]>();
  for (const {
    importId, url,
  } of pairs) {
    const list = byImport.get(importId) ?? [];
    list.push(url);
    byImport.set(importId, list);
  }
  const col = imports[column];
  for (const [importId, urls] of byImport) {
    await db
      .update(imports)
      .set({
        [column]: sql`COALESCE(${col}, ARRAY[]::text[]) || ${urls}::text[]`,
      })
      .where(eq(imports.id, importId));
  }
}

/**
 * Re-evaluate every pending candidate against the *current* Imports Blacklist and mark the matches
 * `blocked`. Ingest filters candidates against the blacklist before staging, so a blacklist entry
 * added *after* an import never catches its already-staged pending items — this sweep closes that
 * gap (e.g. after the user blocks a domain, recheck the queue to block the rest from it). Returns
 * the number of items newly blocked.
 */
export async function recheckPendingItemsAgainstBlacklist(): Promise<RecheckPendingItemsResult> {
  const blacklist = await getImportBlacklist();
  const rows = await db.select().from(importItems).where(eq(importItems.status, "pending"));

  // Pass 1: blacklist check (same as before).
  const blacklistMatched = rows.filter(row => row.url !== null && isBlacklisted(row.url, blacklist));
  const blacklistMatchedIds = blacklistMatched.map(row => row.id);
  if (blacklistMatchedIds.length > 0) {
    await db
      .update(importItems)
      .set({
        status: "blocked",
      })
      .where(inArray(importItems.id, blacklistMatchedIds));
    await appendUrlsToImports(
      blacklistMatched.map(r => ({
        importId: r.importId,
        url: r.url!,
      })),
      "blockedUrls",
    );
  }

  // Pass 2: import rules — evaluate the remaining pending rows.
  const blacklistMatchedSet = new Set(blacklistMatchedIds);
  const stillPending = rows.filter(row => !blacklistMatchedSet.has(row.id));
  const toApproveIds: string[] = [];
  const toBlockUrls: string[] = [];
  const toRejectIds: string[] = [];

  for (const row of stillPending) {
    if (row.url === null) continue;
    const action = await applyImportRules({
      url: row.url,
      title: row.title,
    });
    if (action === "reject") toRejectIds.push(row.id);
    else if (action === "block") toBlockUrls.push(row.url);
    else if (action === "approve") toApproveIds.push(row.id);
  }

  if (toRejectIds.length > 0) {
    await db.update(importItems).set({
      status: "rejected",
    }).where(inArray(importItems.id, toRejectIds));
    const ruleRejectedPairs = stillPending
      .filter(r => toRejectIds.includes(r.id) && r.url != null)
      .map(r => ({
        importId: r.importId,
        url: r.url!,
      }));
    await appendUrlsToImports(ruleRejectedPairs, "rejectedUrls");
  }

  const ruleBlockedIds: string[] = [];
  for (const url of toBlockUrls) {
    const row = stillPending.find(r => r.url === url);
    if (row) ruleBlockedIds.push(row.id);
    try {
      const host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
      await addImportBlacklistEntry({
        kind: "domain",
        value: host,
      });
    }
    catch {
      // Unparseable URL — skip.
    }
  }
  if (ruleBlockedIds.length > 0) {
    await db.update(importItems).set({
      status: "blocked",
    }).where(inArray(importItems.id, ruleBlockedIds));
    const ruleBlockedPairs = stillPending
      .filter(r => ruleBlockedIds.includes(r.id) && r.url != null)
      .map(r => ({
        importId: r.importId,
        url: r.url!,
      }));
    await appendUrlsToImports(ruleBlockedPairs, "blockedUrls");
  }

  for (const id of toApproveIds) {
    try {
      await approveImportItem(id);
    }
    catch {
      // One failure must not abort the rest.
    }
  }

  return {
    blocked: blacklistMatchedIds.length + ruleBlockedIds.length,
    rejected: toRejectIds.length,
  };
}

/** Reject every pending candidate across all imports. Returns the number of rows rejected. */
export async function rejectPendingItems(): Promise<RejectPendingItemsResult> {
  const rows = await db
    .update(importItems)
    .set({
      status: "rejected",
    })
    .where(eq(importItems.status, "pending"))
    .returning({
      id: importItems.id,
      url: importItems.url,
      importId: importItems.importId,
    });
  // Group URLs by import and append in bulk so each import gets one update.
  const byImport = new Map<string, string[]>();
  for (const row of rows) {
    if (row.url) {
      const list = byImport.get(row.importId) ?? [];
      list.push(row.url);
      byImport.set(row.importId, list);
    }
  }
  for (const [importId, urls] of byImport) {
    await db
      .update(imports)
      .set({
        rejectedUrls: sql`COALESCE(${imports.rejectedUrls}, ARRAY[]::text[]) || ${urls}::text[]`,
      })
      .where(eq(imports.id, importId));
  }
  return {
    rejected: rows.length,
  };
}

/** Delete every rejected candidate across all imports. Returns the number of rows deleted. */
export async function deleteRejectedItems(): Promise<PurgeImportItemsResult> {
  const rows = await db
    .delete(importItems)
    .where(eq(importItems.status, "rejected"))
    .returning({
      id: importItems.id,
    });
  return {
    deleted: rows.length,
  };
}

/**
 * Delete an import and its items. The schema FK declares `onDelete: "cascade"`, but we delete the
 * items explicitly first so the Inbox is cleared even where the live constraint predates the
 * cascade. Created bookmarks survive (their `importId` FK is `set null`).
 */
export async function deleteImport(id: string): Promise<boolean> {
  await db.delete(importItems).where(eq(importItems.importId, id));
  const rows = await db
    .delete(imports)
    .where(eq(imports.id, id))
    .returning({
      id: imports.id,
    });
  return rows.length > 0;
}

/**
 * Re-run redirect unwrap + canonicalize for a single item's `rawUrl`. Updates `url`, `status`, and
 * `errorReason` if the result differs. Useful when a link's tracker redirect was unreachable at
 * ingest time (network hiccup, redeploy) and the user wants to retry. Returns the new resolved URL
 * and whether the item was actually updated.
 */
export async function recheckImportItemUrl(
  itemId: string,
): Promise<{ url: string | null;
  updated: boolean; } | null> {
  const [item] = await db.select().from(importItems).where(eq(importItems.id, itemId));
  if (!item) return null;
  if (!item.rawUrl) return {
    url: item.url,
    updated: false,
  };

  const [websites, ignoreList, redirectIgnoreList, customStripParams] = await Promise.all([
    listWebsites(),
    getShortenerIgnoreList(),
    getRedirectIgnoreList(),
    getCustomStripParams(),
  ]);
  const data = {
    mode: "trackers" as const,
    websites,
    ignoreList,
    redirectIgnoreList,
    customStripParams,
  };
  const resolved = await resolveCandidate(
    {
      rawUrl: item.rawUrl,
      anchorText: item.anchorText ?? "",
      source: "html-anchor",
      context: item.newsletterContext,
    },
    data,
  );

  if (resolved.url === item.url && resolved.status === item.status) {
    return {
      url: resolved.url,
      updated: false,
    };
  }
  await db
    .update(importItems)
    .set({
      url: resolved.url,
      status: resolved.status,
      errorReason: resolved.errorReason,
    })
    .where(eq(importItems.id, itemId));
  return {
    url: resolved.url,
    updated: true,
  };
}

/** Delete every approved item (markedForDeletion = true). Keeps blocked items. */
export async function deleteAddedItems(): Promise<PurgeImportItemsResult> {
  const rows = await db
    .delete(importItems)
    .where(eq(importItems.markedForDeletion, true))
    .returning({
      id: importItems.id,
    });
  return {
    deleted: rows.length,
  };
}

/** Delete every blocked item. The Imports Blacklist is intentionally left untouched. */
export async function deleteBlockedItems(): Promise<PurgeImportItemsResult> {
  const rows = await db
    .delete(importItems)
    .where(eq(importItems.status, "blocked"))
    .returning({
      id: importItems.id,
    });
  return {
    deleted: rows.length,
  };
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

/** Subquery selecting every import id that has no associated newsletter. */
function newsletterlessImportIds() {
  return db.select({
    id: imports.id,
  }).from(imports).where(isNull(imports.newsletterId));
}

/** Count import items whose parent import has no newsletter (the Inbox orphans). */
export async function countOrphanedImportItems(): Promise<number> {
  const [row] = await db
    .select({
      value: count(),
    })
    .from(importItems)
    .where(inArray(importItems.importId, newsletterlessImportIds()));
  return row?.value ?? 0;
}

/**
 * Delete every import item whose parent import has no newsletter, regardless of status. Created
 * bookmarks survive (their `importId` FK is `set null`). Returns the number of rows deleted.
 */
export async function deleteOrphanedImportItems(): Promise<OrphanDeleteResult> {
  const rows = await db
    .delete(importItems)
    .where(inArray(importItems.importId, newsletterlessImportIds()))
    .returning({
      id: importItems.id,
    });
  return {
    deleted: rows.length,
  };
}
