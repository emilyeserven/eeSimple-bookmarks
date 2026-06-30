import type { ActiveReelArchiveJob } from "@eesimple/types";

import { Film } from "lucide-react";

import { useActiveReelArchiveJobs, useReelArchiveCompletionToast } from "../hooks/useReelArchive";

import { Button } from "@/components/ui/button";
import { ResponsivePopover } from "@/components/ui/responsive-popover";

/** One row in the progress popover: the bookmark title + its current status. */
function ActiveReelArchiveRow({
  item,
}: { item: ActiveReelArchiveJob }) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="truncate">{item.bookmarkTitle}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {item.status === "queued" ? "Queued…" : "Archiving…"}
      </span>
    </li>
  );
}

/**
 * Header-stripe indicator for in-flight reel-archive jobs. Renders nothing when none is active;
 * otherwise a spinning film icon + count that opens a popover listing each queued/processing capture.
 * Completion toasts are driven by `useReelArchiveCompletionToast`, mounted here so they fire app-wide
 * regardless of the current page. Mirrors `ImportProgressIndicator`.
 */
export function ReelArchiveProgressIndicator() {
  const {
    data: active,
  } = useActiveReelArchiveJobs();
  useReelArchiveCompletionToast(active);

  if (!active || active.length === 0) return null;

  const count = active.length;

  return (
    <ResponsivePopover
      title="Reels archiving"
      align="end"
      trigger={(
        <Button
          variant="ghost"
          size="sm"
          // `ml-auto` anchors the right-hand header cluster when this indicator is the first
          // right-aligned element (HeaderToolbar carries its own `ml-auto` for when this is absent).
          className="ml-auto gap-2"
          aria-label={`${count} reel${count === 1 ? "" : "s"} archiving`}
        >
          <Film className="size-4 animate-pulse" />
          <span className="text-xs tabular-nums">{count}</span>
        </Button>
      )}
    >
      <ul className="w-64 space-y-2">
        {active.map(item => (
          <ActiveReelArchiveRow
            key={item.id}
            item={item}
          />
        ))}
      </ul>
    </ResponsivePopover>
  );
}
