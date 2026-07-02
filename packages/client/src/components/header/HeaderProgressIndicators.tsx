import type { ActivitySection } from "@/hooks/useHeaderActivity";
import type { ActivityRow } from "@/lib/headerActivity";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ResponsivePopover } from "@/components/ui/responsive-popover";
import { useHeaderActivity } from "@/hooks/useHeaderActivity";

/** One activity row: label + progress detail, with a thin progress bar when a fraction is known. */
function ActivityRowItem({
  row,
}: { row: ActivityRow }) {
  return (
    <li className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate">{row.label}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{row.detail}</span>
      </div>
      {row.fraction !== null && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{
              width: `${Math.round(row.fraction * 100)}%`,
            }}
          />
        </div>
      )}
    </li>
  );
}

/** One titled group (Imports / Reels archiving / Fetching images / Channel avatars) of rows. */
function ActivitySectionBlock({
  section,
}: { section: ActivitySection }) {
  const Icon = section.icon;
  return (
    <div className="space-y-2">
      <div
        className="
          flex items-center gap-2 text-xs font-medium text-muted-foreground
        "
      >
        <Icon className="size-3.5" />
        <span>{section.title}</span>
      </div>
      <ul className="space-y-2">
        {section.rows.map(row => (
          <ActivityRowItem
            key={row.key}
            row={row}
          />
        ))}
      </ul>
    </div>
  );
}

/**
 * The single app-header progress indicator. Consolidates every background job that once had its own
 * header button (imports + reel archiving + image auto-fetch + channel-avatar backfill, issue #434)
 * into one spinner + count that opens a popover grouping the active jobs into sections. Renders
 * nothing when idle. All polling and app-wide completion toasts live in `useHeaderActivity`.
 */
export function HeaderProgressIndicators() {
  const {
    sections, activeCount,
  } = useHeaderActivity();

  if (activeCount === 0) return null;

  return (
    <ResponsivePopover
      title="Background activity"
      align="end"
      trigger={(
        <Button
          variant="ghost"
          size="sm"
          // `ml-auto` anchors the right-hand header cluster when this indicator is present
          // (HeaderToolbar carries its own `ml-auto` for when this is absent).
          className="ml-auto gap-2"
          aria-label={`${activeCount} background task${activeCount === 1 ? "" : "s"} in progress`}
        >
          <Loader2 className="size-4 animate-spin" />
          <span className="text-xs tabular-nums">{activeCount}</span>
        </Button>
      )}
    >
      <div className="w-64 space-y-4">
        {sections.map(section => (
          <ActivitySectionBlock
            key={section.key}
            section={section}
          />
        ))}
      </div>
    </ResponsivePopover>
  );
}
