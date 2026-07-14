/**
 * Row-mapping leaf shared by `importReads.ts` and `importItems.ts`: converting DB timestamp values
 * and `import_items` rows to their wire shapes. Deliberately NOT re-exported by the `imports.ts`
 * barrel — these were private helpers in the pre-split file, so keeping them out of the barrel's
 * `export *` list preserves the original (unexported) public surface of `@/services/imports`.
 */

import type { ImportItem, ImportItemStatus } from "@eesimple/types";
import type { ImportItemRow } from "@/db/schema";

export function isoOf(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function toItem(row: ImportItemRow): ImportItem {
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
