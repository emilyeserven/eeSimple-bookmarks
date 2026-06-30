import type { GalleryLayout, GalleryView } from "./galleryFormat";
import type { useAutoFetchImages, useAutoFetchWithFallback, useScanBucket } from "../hooks/useGallery";

import { Download, Images, LayoutGrid, RefreshCw, Square, Table } from "lucide-react";

import { formatSize } from "./galleryFormat";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const BYTES_PER_IMAGE_ESTIMATE = 200 * 1024;

interface GalleryToolbarProps {
  view: GalleryView;
  onViewChange: (view: GalleryView) => void;
  layout: GalleryLayout;
  onLayoutChange: (layout: GalleryLayout) => void;
  scan: ReturnType<typeof useScanBucket>;
  autoFetch: ReturnType<typeof useAutoFetchImages>;
  autoFetchRunning: boolean;
  autoFetchWithFallback: ReturnType<typeof useAutoFetchWithFallback>;
  autoFetchWithFallbackRunning: boolean;
  pendingAutoFetchCount: number;
}

export function GalleryToolbar({
  view, onViewChange, layout, onLayoutChange, scan, autoFetch, autoFetchRunning,
  autoFetchWithFallback, autoFetchWithFallbackRunning, pendingAutoFetchCount,
}: GalleryToolbarProps) {
  const eitherRunning = autoFetchRunning || autoFetchWithFallbackRunning;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={scan.isPending}
        onClick={() => scan.mutate()}
      >
        <RefreshCw
          className={`
            size-4
            ${scan.isPending ? "animate-spin" : ""}
          `}
        />
        {scan.isPending ? "Scanning…" : "Scan bucket"}
      </Button>

      {pendingAutoFetchCount > 0
        ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={autoFetch.isPending || eitherRunning}
              onClick={() => autoFetch.mutate()}
            >
              <Download className="size-4" />
              {autoFetchRunning ? "Fetching…" : "Fetch missing images"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={autoFetchWithFallback.isPending || eitherRunning}
              onClick={() => autoFetchWithFallback.mutate()}
            >
              <Download className="size-4" />
              {autoFetchWithFallbackRunning ? "Fetching…" : "Fetch missing images (screenshot fallback)"}
            </Button>
          </>
        )
        : null}

      <ToggleGroup
        type="single"
        value={view}
        onValueChange={value => value && onViewChange(value as GalleryView)}
        size="sm"
      >
        <ToggleGroupItem
          value="grid"
          title="Grid"
        >
          <LayoutGrid className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="table"
          title="Table"
        >
          <Table className="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      {view === "grid"
        ? (
          <ToggleGroup
            type="single"
            value={layout}
            onValueChange={value => value && onLayoutChange(value as GalleryLayout)}
            size="sm"
          >
            <ToggleGroupItem
              value="natural"
              title="Natural aspect ratio"
            >
              <Images className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="square"
              title="Square"
            >
              <Square className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        )
        : null}

      {pendingAutoFetchCount > 0 && !autoFetchRunning
        ? (
          <p className="text-sm text-muted-foreground">
            {`${pendingAutoFetchCount} missing (~${formatSize(pendingAutoFetchCount * BYTES_PER_IMAGE_ESTIMATE)} est.)`}
          </p>
        )
        : null}

      {scan.data
        ? (
          <p className="text-sm text-muted-foreground">
            {`Added ${scan.data.added}, updated ${scan.data.updated}, pruned ${scan.data.pruned}.`}
          </p>
        )
        : null}
    </div>
  );
}
