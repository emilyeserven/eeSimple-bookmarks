/**
 * Import item lifecycle: edit/reject/block a staged candidate, plus the bulk sweep and purge
 * operations over `import_items`. The approve flow (wiring a candidate to `createBookmark`) lives in
 * `importApproveFlow.ts`; the pure extraction lives in `newsletterIngest.ts` and the redirect
 * resolution the ingest pipeline uses lives in `importPipeline.ts`.
 *
 * Staging rows are NOT matchable bookmark data, so writes here never call `invalidateBookmarkCache`.
 * `createBookmark` (invoked via `approveImportItem` on approve) touches the cache, which it already
 * does internally.
 */

import { and, count, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import type {
  ImportBlacklistEntry,
  ImportItem,
  OrphanDeleteResult,
  PurgeImportItemsResult,
  RecheckPendingItemsResult,
  RejectPendingItemsResult,
  UpdateImportItemInput,
} from "@eesimple/types";
import { isBlacklisted } from "@eesimple/types";
import { db } from "@/db";
import { type ImportItemRow, importItems, imports } from "@/db/schema";
import { addImportBlacklistEntry, getImportBlacklist } from "@/services/appSettings";
import { applyImportRules } from "@/services/importRules";
import { approveImportItem } from "@/services/importApproveFlow";
import { toItem } from "@/services/importRowMapping";

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

/**
 * Subquery selecting import ids that lost their newsletter — newsletter-sourced imports (paste/url/upload)
 * whose newsletterId was cleared. Extension quick-saves never have a newsletter and are excluded.
 */
function orphanedImportIds() {
  return db.select({
    id: imports.id,
  }).from(imports).where(and(isNull(imports.newsletterId), ne(imports.source, "extension")));
}

/** Count import items whose parent import has no newsletter (the Inbox orphans). */
export async function countOrphanedImportItems(): Promise<number> {
  const [row] = await db
    .select({
      value: count(),
    })
    .from(importItems)
    .where(inArray(importItems.importId, orphanedImportIds()));
  return row?.value ?? 0;
}

/**
 * Delete every import item whose parent import has no newsletter, regardless of status. Created
 * bookmarks survive (their `importId` FK is `set null`). Returns the number of rows deleted.
 */
export async function deleteOrphanedImportItems(): Promise<OrphanDeleteResult> {
  const rows = await db
    .delete(importItems)
    .where(inArray(importItems.importId, orphanedImportIds()))
    .returning({
      id: importItems.id,
    });
  return {
    deleted: rows.length,
  };
}

/** Looks up a pending `import_items` row for `url`, or `null` if none is queued. */
export async function findPendingImportItemByUrl(url: string): Promise<{ id: string } | null> {
  const [existingPending] = await db
    .select({
      id: importItems.id,
    })
    .from(importItems)
    .where(and(eq(importItems.url, url), eq(importItems.status, "pending")))
    .limit(1);
  return existingPending ?? null;
}
