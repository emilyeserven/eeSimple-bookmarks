/**
 * Import listing/summary reads: turn `imports`/`import_items` rows into the render-ready
 * `ImportSummary`/`ImportItem`/`InboxItem` shapes, plus the single-import fetch (`getImport`) other
 * import modules build on. This is a leaf module — it depends only on the DB/schema/types, never on
 * a sibling import-service module, so both `importPipeline.ts` and `importItems.ts` can import from
 * it without creating a cycle.
 *
 * Staging rows are NOT matchable bookmark data, so writes here never call `invalidateBookmarkCache`.
 */

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type {
  ActiveImport,
  ImportItemStatus,
  ImportSource,
  ImportStatus,
  ImportSummary,
  InboxItem,
  Import as ImportRecord,
} from "@eesimple/types";
import { db } from "@/db";
import {
  bookmarks,
  importItems,
  imports,
  type ImportRow,
  newsletters,
} from "@/db/schema";
import { isoOf, toItem } from "@/services/importRowMapping";

const STATUS_KEYS: ImportItemStatus[] = [
  "pending",
  "approved",
  "rejected",
  "duplicate",
  "error",
  "blocked",
];

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
    sourceLabel: row.newsletterName ?? row.importTitle ?? row.importSourceUrl
      ?? (row.importSource === "extension" ? "Browser extension" : null),
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
