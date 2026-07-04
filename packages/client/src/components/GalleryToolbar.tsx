import type { GalleryLayout, GalleryView } from "./galleryFormat";
import type { useAutoFetchImages, useAutoFetchWithFallback, useScanBucket } from "../hooks/useGallery";

import { Download, Images, LayoutGrid, RefreshCw, Square, Table } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const {
    t,
  } = useTranslation();
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
        {scan.isPending ? t("Scanning…") : t("Scan bucket")}
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
              {autoFetchRunning ? t("Fetching…") : t("Fetch missing images")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={autoFetchWithFallback.isPending || eitherRunning}
              onClick={() => autoFetchWithFallback.mutate()}
            >
              <Download className="size-4" />
              {autoFetchWithFallbackRunning ? t("Fetching…") : t("Fetch missing images (screenshot fallback)")}
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
          title={t("Grid")}
        >
          <LayoutGrid className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="table"
          title={t("Table")}
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
              title={t("Natural aspect ratio")}
            >
              <Images className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="square"
              title={t("Square")}
            >
              <Square className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        )
        : null}

      {pendingAutoFetchCount > 0 && !autoFetchRunning
        ? (
          <p className="text-sm text-muted-foreground">
            {t("{{count}} missing (~{{size}} est.)", {
              count: pendingAutoFetchCount,
              size: formatSize(pendingAutoFetchCount * BYTES_PER_IMAGE_ESTIMATE),
            })}
          </p>
        )
        : null}

      {scan.data
        ? (
          <p className="text-sm text-muted-foreground">
            {t("Added {{added}}, updated {{updated}}, pruned {{pruned}}.", {
              added: scan.data.added,
              updated: scan.data.updated,
              pruned: scan.data.pruned,
            })}
          </p>
        )
        : null}
    </div>
  );
}
