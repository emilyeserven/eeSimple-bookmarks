/**
 * Import approval flow: turn a staged candidate (or every pending candidate in an import) into a real
 * bookmark via `createBookmark`, resolving the newsletter/autofill/pre-fill defaults that feed it. The
 * pure input-building lives in `importApproval.ts`; this module wires those helpers to the DB.
 *
 * Staging rows are NOT matchable bookmark data, so writes here never call `invalidateBookmarkCache`.
 * `createBookmark` (invoked on approve) touches the cache, which it already does internally.
 */

import { asc, eq, sql } from "drizzle-orm";
import type { ImportApproveResult, InboxPreFillDefaults } from "@eesimple/types";
import { db } from "@/db";
import { importItems, imports } from "@/db/schema";
import { suggestAutofillForBookmark } from "@/services/autofill";
import { checkBookmarkUrlDuplicate, createBookmark, DuplicateUrlError } from "@/services/bookmarks";
import { approvalTitle, buildApprovalBookmarkInput, mergeApprovalPropertyValues, pickApprovalCategoryId } from "@/services/importApproval";
import {
  getNewsletterCategoryId,
  getNewsletterMediaTypeId,
  getNewsletterTagIds,
} from "@/services/newsletters";

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

  // Category precedence (see pickApprovalCategoryId): per-item override > preFill > import default >
  // newsletter default > autofill. Only query the import row when no per-item override is set.
  let categoryId = item.categoryId ?? undefined;
  if (categoryId === undefined) {
    const [importRow] = await db
      .select({
        defaultCategoryId: imports.defaultCategoryId,
      })
      .from(imports)
      .where(eq(imports.id, item.importId));
    categoryId = pickApprovalCategoryId({
      itemCategoryId: item.categoryId,
      preFillCategoryId: preFill?.categoryId,
      importDefaultCategoryId: importRow?.defaultCategoryId,
      newsletterDefaultCategoryId: defaults.categoryId,
      autofillCategoryId: autofill.categoryId,
    });
  }

  // Merge pre-fill custom property values with autofill values: autofill wins for any property it
  // already sets; pre-fill fills in the rest.
  const {
    numberValues: mergedNumberValues,
    booleanValues: mergedBooleanValues,
    dateTimeValues: mergedDateTimeValues,
  } = mergeApprovalPropertyValues(autofill, preFill);

  try {
    const bookmark = await createBookmark(buildApprovalBookmarkInput({
      url: item.url,
      title,
      item,
      defaults,
      preFill,
      autofillTagIds: autofill.tagIds,
      autofillLocationIds: autofill.locationIds,
      autofillMediaTypeId: autofill.mediaTypeId,
      mergedNumberValues,
      mergedBooleanValues,
      mergedDateTimeValues,
      categoryId,
    }));
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
