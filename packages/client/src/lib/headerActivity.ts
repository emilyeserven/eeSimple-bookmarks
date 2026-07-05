import type { ActiveImport, ActiveReelArchiveJob, AutoFetchJobStatus } from "@eesimple/types";

import i18n from "../i18n";

/**
 * One row in the consolidated header "Background activity" popover: a label, a short progress detail,
 * and an optional 0–1 fraction (null = indeterminate, so no progress bar is drawn).
 */
export interface ActivityRow {
  key: string;
  label: string;
  detail: string;
  fraction: number | null;
}

/** A short human description of one in-flight import's progress. */
export function importProgressLabel(item: ActiveImport): string {
  if (item.status === "queued" || item.totalCount === null) return i18n.t("Queued…");
  const done = item.processedCount ?? 0;
  return `${done} / ${item.totalCount}`;
}

/** Fraction 0–1 of an import's links processed (0 while queued / before extraction). */
export function importProgressFraction(item: ActiveImport): number {
  if (!item.totalCount || item.totalCount === 0) return 0;
  return Math.min(1, (item.processedCount ?? 0) / item.totalCount);
}

/** A row for one queued/processing import (source label + processed/total bar). */
export function importRow(item: ActiveImport): ActivityRow {
  return {
    key: item.id,
    label: item.sourceLabel ?? i18n.t("Import"),
    detail: importProgressLabel(item),
    fraction: importProgressFraction(item),
  };
}

/** A row for one queued/processing reel-archive job (bookmark title + status, no progress bar). */
export function reelRow(item: ActiveReelArchiveJob): ActivityRow {
  return {
    key: item.id,
    label: item.bookmarkTitle,
    detail: item.status === "queued" ? i18n.t("Queued…") : i18n.t("Archiving…"),
    fraction: null,
  };
}

/**
 * A row for a running image auto-fetch job (missing-image, screenshot fallback, or channel-avatar
 * backfill — they share the {@link AutoFetchJobStatus} shape). Returns null unless the job is running.
 */
export function fetchRow(
  key: string,
  label: string,
  status: AutoFetchJobStatus | undefined,
): ActivityRow | null {
  if (!status || status.status !== "running") return null;
  const {
    totalCount, processedCount,
  } = status;
  return {
    key,
    label,
    detail: totalCount > 0 ? `${processedCount} / ${totalCount}` : "…",
    fraction: totalCount > 0 ? Math.min(1, processedCount / totalCount) : 0,
  };
}
