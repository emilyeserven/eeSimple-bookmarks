/**
 * Quick-save entry points that bypass (or fast-path) the Inbox review queue: staging a single URL
 * straight into the Inbox, and creating a real bookmark directly from a URL + title — both used by the
 * browser extension and the PWA share target.
 *
 * Staging rows are NOT matchable bookmark data, so writes here never call `invalidateBookmarkCache`.
 * `createBookmark` (invoked by `quickAddBookmarkDirect`) touches the cache, which it already does
 * internally.
 */

import type { CreateBookmarkInput } from "@eesimple/types";
import { db } from "@/db";
import { importItems, imports } from "@/db/schema";
import { suggestAutofillForBookmark } from "@/services/autofill";
import { checkBookmarkUrlDuplicate, createBookmark, DuplicateUrlError } from "@/services/bookmarks";
import { approvalTitle } from "@/services/importApproval";
import { findPendingImportItemByUrl } from "@/services/importItems";

/**
 * Queue a single URL directly into the Inbox review queue — used by the browser extension and
 * PWA share target. Creates a completed one-item "extension" import so no background processing
 * is needed, then stages the item as pending for review.
 *
 * Returns `{ id }` of the created import item, or `null` when the URL is already a saved bookmark
 * or already pending in the inbox (caller should return 409).
 */
export async function quickSaveToInbox(
  url: string,
  title: string,
): Promise<{ id: string } | null> {
  const dup = await checkBookmarkUrlDuplicate(url);
  if (dup.exactMatch ?? dup.pathMatch) return null;

  const existingPending = await findPendingImportItemByUrl(url);
  if (existingPending) return null;

  const [importRow] = await db
    .insert(imports)
    .values({
      source: "extension",
      status: "complete",
      totalCount: 1,
      processedCount: 1,
    })
    .returning({
      id: imports.id,
    });

  if (!importRow) throw new Error("Failed to create import record");

  const [itemRow] = await db
    .insert(importItems)
    .values({
      importId: importRow.id,
      url,
      rawUrl: url,
      title,
      status: "pending",
    })
    .returning({
      id: importItems.id,
    });

  if (!itemRow) throw new Error("Failed to create import item");

  return {
    id: itemRow.id,
  };
}

/**
 * Create a real bookmark directly from a single URL + title, bypassing the Inbox review queue —
 * used by the browser extension's "Add as bookmark" button/context menu and the PWA share target
 * when the "shared links skip the inbox" setting is on.
 *
 * Reuses the exact bookmark-building path Inbox approval uses (`suggestAutofillForBookmark` +
 * `buildApprovalBookmarkInput` + `createBookmark`), so a directly-added bookmark applies the same
 * autofill rules, category/tag/media defaults, and image capture an approved item would — parity by
 * construction. Returns the created bookmark's `{ id }`, or `null` when the URL is already a saved
 * bookmark (caller should return 409).
 */
export async function quickAddBookmarkDirect(
  url: string,
  title: string,
): Promise<{ id: string } | null> {
  const dup = await checkBookmarkUrlDuplicate(url);
  if (dup.exactMatch ?? dup.pathMatch) return null;

  const resolvedTitle = approvalTitle({
    title,
    url,
  });
  const autofill = await suggestAutofillForBookmark({
    url,
    title: resolvedTitle,
  });

  // No import row, newsletter, or pre-fill for a direct add — the bookmark carries only the URL,
  // title, and whatever the autofill rules matched. (Unlike Inbox approval, there is no importId to
  // spread in, so build the input directly rather than via buildApprovalBookmarkInput.)
  const input: CreateBookmarkInput = {
    url,
    title: resolvedTitle,
    description: null,
    categoryId: autofill.categoryId ?? undefined,
    mediaTypeId: autofill.mediaTypeId ?? undefined,
    tagIds: autofill.tagIds,
    locationIds: autofill.locationIds,
    numberValues: autofill.numberValues.length > 0 ? autofill.numberValues : undefined,
    booleanValues: autofill.booleanValues.length > 0 ? autofill.booleanValues : undefined,
    dateTimeValues: autofill.dateTimeValues.length > 0 ? autofill.dateTimeValues : undefined,
  };

  try {
    const bookmark = await createBookmark(input);
    return {
      id: bookmark.id,
    };
  }
  catch (err) {
    // A concurrent save could have created the same URL between the dup check and insert.
    if (err instanceof DuplicateUrlError) return null;
    throw err;
  }
}
