import type { BulkDeleteResult } from "@eesimple/types";

import { useMutation } from "@tanstack/react-query";

import { notifyBulkResult } from "../lib/bulkResults";

/**
 * Generic bulk-delete mutation for a taxonomy listing: deletes the given ids via the entity's
 * `bulkDelete` API, runs the caller's `invalidate` closure, and fires one summarizing toast
 * ("3 deleted, 1 skipped (built-in)"). Per-entity hooks (`useBulkDeleteCategories`, …) wrap this so a
 * Manager only needs the hook, not the API + invalidation wiring.
 */
export function useBulkDeleteEntity(
  bulkDelete: (ids: string[]) => Promise<BulkDeleteResult[]>,
  invalidate: () => void,
) {
  return useMutation({
    mutationFn: (ids: string[]) => bulkDelete(ids),
    onSuccess: (results) => {
      invalidate();
      notifyBulkResult(results, "deleted");
    },
  });
}
