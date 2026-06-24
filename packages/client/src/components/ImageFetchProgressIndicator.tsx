import { ImageDown, Loader2 } from "lucide-react";

import { useAutoFetchCompletionToast, useAutoFetchStatus } from "../hooks/useGallery";

import { Button } from "@/components/ui/button";
import { ResponsivePopover } from "@/components/ui/responsive-popover";

/**
 * Header-stripe indicator for the background image auto-fetch job. Renders nothing when no job is
 * running; otherwise shows a spinner + processed/total count that opens a popover with details.
 * Completion toasts are fired by `useAutoFetchCompletionToast`, mounted here so they fire app-wide.
 */
export function ImageFetchProgressIndicator() {
  const {
    data: status,
  } = useAutoFetchStatus();
  useAutoFetchCompletionToast(status);

  if (!status || status.status !== "running") return null;

  const {
    totalCount, processedCount,
  } = status;
  const summary = totalCount > 0 ? `${processedCount}/${totalCount}` : "…";
  const fraction = totalCount > 0 ? Math.min(1, processedCount / totalCount) : 0;

  return (
    <ResponsivePopover
      title="Fetching images"
      align="end"
      trigger={(
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto gap-2"
          aria-label="Image fetch in progress"
        >
          <Loader2 className="size-4 animate-spin" />
          <ImageDown className="size-4" />
          <span className="text-xs tabular-nums">{summary}</span>
        </Button>
      )}
    >
      <div className="w-56 space-y-2">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="truncate">Fetching missing images</span>
          <span className="shrink-0 text-xs text-muted-foreground">{summary}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{
              width: `${Math.round(fraction * 100)}%`,
            }}
          />
        </div>
      </div>
    </ResponsivePopover>
  );
}
