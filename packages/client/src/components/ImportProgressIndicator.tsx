import type { ActiveImport } from "@eesimple/types";

import { Loader2 } from "lucide-react";

import { useActiveImports, useImportCompletionToasts } from "../hooks/useImports";

import { Button } from "@/components/ui/button";
import { ResponsivePopover } from "@/components/ui/responsive-popover";

/** A short human description of one in-flight import's progress. */
function progressLabel(item: ActiveImport): string {
  if (item.status === "queued" || item.totalCount === null) return "Queued…";
  const done = item.processedCount ?? 0;
  return `${done} / ${item.totalCount}`;
}

/** Fraction 0–1 of an import's links processed (0 while queued / before extraction). */
function progressFraction(item: ActiveImport): number {
  if (!item.totalCount || item.totalCount === 0) return 0;
  return Math.min(1, (item.processedCount ?? 0) / item.totalCount);
}

/** One row in the progress popover: source label + a thin progress bar + count. */
function ActiveImportRow({
  item,
}: { item: ActiveImport }) {
  return (
    <li className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate">{item.sourceLabel ?? "Import"}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{progressLabel(item)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{
            width: `${Math.round(progressFraction(item) * 100)}%`,
          }}
        />
      </div>
    </li>
  );
}

/**
 * Header-stripe indicator for in-flight imports (issue #434). Renders nothing when no import is
 * active; otherwise a spinner + aggregate processed/total count that opens a popover listing each
 * queued/processing import with its own progress. Completion toasts are driven by
 * `useImportCompletionToasts`, mounted here so they fire app-wide regardless of the current page.
 */
export function ImportProgressIndicator() {
  const {
    data: active,
  } = useActiveImports();
  useImportCompletionToasts(active);

  if (!active || active.length === 0) return null;

  const totals = active.reduce(
    (acc, item) => ({
      processed: acc.processed + (item.processedCount ?? 0),
      total: acc.total + (item.totalCount ?? 0),
    }),
    {
      processed: 0,
      total: 0,
    },
  );
  const count = active.length;
  const summary = totals.total > 0 ? `${totals.processed}/${totals.total}` : `${count}`;

  return (
    <ResponsivePopover
      title="Imports in progress"
      align="end"
      trigger={(
        <Button
          variant="ghost"
          size="sm"
          // `ml-auto` anchors the right-hand header cluster when this indicator is the first
          // right-aligned element (HeaderToolbar carries its own `ml-auto` for when this is absent).
          className="ml-auto gap-2"
          aria-label={`${count} import${count === 1 ? "" : "s"} in progress`}
        >
          <Loader2 className="size-4 animate-spin" />
          <span className="text-xs tabular-nums">{summary}</span>
        </Button>
      )}
    >
      <ul className="w-64 space-y-3">
        {active.map(item => (
          <ActiveImportRow
            key={item.id}
            item={item}
          />
        ))}
      </ul>
    </ResponsivePopover>
  );
}
