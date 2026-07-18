import type { BulkBookmarkResult, BulkDeleteResult } from "@eesimple/types";

/**
 * Delete many entities by looping a single-item delete, reporting per-item outcomes without aborting
 * the batch. A delete returning `false` (missing row) is `not-found`; a thrown built-in guard error
 * (detected by `isBuiltInError`) is `skipped-built-in`; any other throw is `error`. This preserves
 * each entity's cascade side-effects and built-in protections — the bulk path never bypasses them.
 */
export async function bulkDeleteEntities(
  ids: string[],
  deleteOne: (id: string) => Promise<boolean>,
  isBuiltInError: (err: unknown) => boolean = () => false,
): Promise<BulkDeleteResult[]> {
  const results: BulkDeleteResult[] = [];
  for (const id of ids) {
    try {
      const deleted = await deleteOne(id);
      results.push({
        id,
        status: deleted ? "deleted" : "not-found",
      });
    }
    catch (err) {
      if (isBuiltInError(err)) {
        results.push({
          id,
          status: "skipped-built-in",
          message: err instanceof Error ? err.message : undefined,
        });
      }
      else {
        results.push({
          id,
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
  return results;
}

/**
 * Apply a single-item update across many entities, reporting per-item outcomes without aborting the
 * batch — the update sibling of {@link bulkDeleteEntities} (the `bulkUpdateWebsites` loop shape). A
 * nullish return is `not-found`; a throw is `error` with the message (so per-item guards like the
 * tag cycle check surface per row instead of failing the whole batch).
 */
export async function bulkApplyEntities(
  ids: string[],
  applyOne: (id: string) => Promise<unknown>,
): Promise<BulkBookmarkResult[]> {
  const results: BulkBookmarkResult[] = [];
  for (const id of ids) {
    try {
      const updated = await applyOne(id);
      results.push({
        id,
        status: updated ? "applied" : "not-found",
      });
    }
    catch (err) {
      results.push({
        id,
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}
