import type { BulkDeleteResult } from "@eesimple/types";

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
