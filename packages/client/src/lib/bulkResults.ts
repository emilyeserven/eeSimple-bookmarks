import type { BulkBookmarkResult, BulkDeleteResult } from "@eesimple/types";

import { notifyError, notifySuccess } from "./notifications";

/** Any per-item bulk outcome — both bookmark and taxonomy results share the `status`/`message` shape. */
type AnyBulkResult = BulkBookmarkResult | BulkDeleteResult;

/** Items that succeeded (were applied or deleted). */
function successCount(results: AnyBulkResult[]): number {
  return results.filter(r => r.status === "applied" || r.status === "deleted").length;
}

/**
 * Build a human summary like "12 updated, 1 skipped (built-in), 2 failed" from per-item bulk results.
 * `verb` is the past-tense success word for the action (e.g. "updated", "deleted", "tagged").
 */
export function summarizeBulk(results: AnyBulkResult[], verb: string): string {
  const builtIn = results.filter(r => r.status === "skipped-built-in").length;
  const notFound = results.filter(r => r.status === "not-found").length;
  const errors = results.filter(r => r.status === "error").length;
  const parts = [`${successCount(results)} ${verb}`];
  if (builtIn > 0) parts.push(`${builtIn} skipped (built-in)`);
  if (notFound > 0) parts.push(`${notFound} not found`);
  if (errors > 0) parts.push(`${errors} failed`);
  return parts.join(", ");
}

/**
 * Fire a single summarizing toast for a completed bulk action: an error toast when nothing succeeded,
 * otherwise a success toast. Recorded in the Notifications log like any other persisted action.
 */
export function notifyBulkResult(results: AnyBulkResult[], verb: string): void {
  const message = summarizeBulk(results, verb);
  if (successCount(results) === 0 && results.length > 0) {
    notifyError(message);
  }
  else {
    notifySuccess(message);
  }
}
