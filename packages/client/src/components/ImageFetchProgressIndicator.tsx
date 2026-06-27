import { ImageDown, Loader2 } from "lucide-react";

import { useAutoFetchCompletionToast, useAutoFetchStatus, useAutoFetchWithFallbackCompletionToast, useAutoFetchWithFallbackStatus } from "../hooks/useGallery";

import { Button } from "@/components/ui/button";
import { ResponsivePopover } from "@/components/ui/responsive-popover";

function FetchProgressPopover({
  label,
  totalCount,
  processedCount,
}: { label: string;
  totalCount: number;
  processedCount: number; }) {
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
          <span className="truncate">{label}</span>
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

/**
 * Header-stripe indicator for background image auto-fetch jobs. Renders nothing when no job is
 * running; otherwise shows a spinner + processed/total count that opens a popover with details.
 * Completion toasts are fired app-wide by the mounted completion-toast hooks.
 */
export function ImageFetchProgressIndicator() {
  const {
    data: status,
  } = useAutoFetchStatus();
  const {
    data: fallbackStatus,
  } = useAutoFetchWithFallbackStatus();
  useAutoFetchCompletionToast(status);
  useAutoFetchWithFallbackCompletionToast(fallbackStatus);

  if (status?.status === "running") {
    return (
      <FetchProgressPopover
        label="Fetching missing images"
        totalCount={status.totalCount}
        processedCount={status.processedCount}
      />
    );
  }

  if (fallbackStatus?.status === "running") {
    return (
      <FetchProgressPopover
        label="Fetching images (screenshot fallback)"
        totalCount={fallbackStatus.totalCount}
        processedCount={fallbackStatus.processedCount}
      />
    );
  }

  return null;
}
