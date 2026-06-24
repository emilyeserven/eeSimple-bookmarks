import type { GalleryLayout, GalleryView } from "./galleryFormat";
import type { Bookmark, MediaObject } from "@eesimple/types";

import { useState } from "react";

import { Download, Images, LayoutGrid, RefreshCw, Square, Table } from "lucide-react";

import { GalleryDialogs } from "./GalleryDialogs";
import { formatSize } from "./galleryFormat";
import { OrphansGrid, RegisteredGrid, StorageSummary } from "./GalleryGrids";
import { galleryColumns } from "./tables/galleryColumns";
import { useBookmarks } from "../hooks/useBookmarks";
import { useAttachOrphan, useAutoFetchImages, useAutoFetchStatus, useDeleteOrphans, useGallery, useScanBucket } from "../hooks/useGallery";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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
  pendingAutoFetchCount: number;
}

function GalleryToolbar({
  view, onViewChange, layout, onLayoutChange, scan, autoFetch, autoFetchRunning, pendingAutoFetchCount,
}: GalleryToolbarProps) {
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={autoFetch.isPending || autoFetchRunning}
            onClick={() => autoFetch.mutate()}
          >
            <Download className="size-4" />
            {autoFetchRunning ? "Fetching…" : "Fetch missing images"}
          </Button>
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

interface GalleryContentProps {
  view: GalleryView;
  layout: GalleryLayout;
  registered: MediaObject[];
  orphans: MediaObject[];
  onDeleteAll: () => void;
  onAttach: (key: string) => void;
  onDelete: (key: string) => void;
}

/**
 * The catalog body: one combined data table, or the registered + orphan grids. Extracted from
 * {@link GalleryListing} so the view-switching conditionals don't inflate its complexity.
 */
function GalleryContent({
  view, layout, registered, orphans, onDeleteAll, onAttach, onDelete,
}: GalleryContentProps) {
  if (view === "table") {
    return (
      <DataTable
        columns={galleryColumns({
          onAttach,
          onDelete,
        })}
        data={[...registered, ...orphans]}
        sortable
      />
    );
  }
  return (
    <>
      {registered.length > 0
        ? (
          <RegisteredGrid
            registered={registered}
            layout={layout}
          />
        )
        : null}
      {orphans.length > 0
        ? (
          <OrphansGrid
            orphans={orphans}
            layout={layout}
            onDeleteAll={onDeleteAll}
            onAttach={onAttach}
            onDelete={onDelete}
          />
        )
        : null}
    </>
  );
}

/**
 * The Media Management catalog: every object in the storage bucket, split into images still linked
 * to a bookmark and orphans (objects with no live bookmark) that can be reclaimed. The bucket is
 * reconciled on demand with "Scan bucket". Shown either as a thumbnail grid (natural aspect ratio by
 * default, or uniform squares) or as a data table.
 */
export function GalleryListing() {
  const {
    data: catalog, isLoading, error,
  } = useGallery();
  const {
    data: allBookmarks = [],
  } = useBookmarks();
  const scan = useScanBucket();
  const autoFetch = useAutoFetchImages();
  const {
    data: autoFetchStatus,
  } = useAutoFetchStatus();
  const autoFetchRunning = autoFetchStatus?.status === "running";
  const deleteOrphans = useDeleteOrphans();
  const attachOrphan = useAttachOrphan();

  const [view, setView] = useState<GalleryView>("grid");
  const [layout, setLayout] = useState<GalleryLayout>("natural");

  // The pending confirm: one orphan key, or every orphan key for the bulk action.
  const [pending, setPending] = useState<{ keys: string[];
    label: string; } | null>(null);

  // State for the attach dialog.
  const [attachKey, setAttachKey] = useState<string | null>(null);
  const [attachTarget, setAttachTarget] = useState<Bookmark | null>(null);

  const registered = catalog?.registered ?? [];
  const orphans = catalog?.orphans ?? [];

  function confirmDelete(): void {
    if (!pending) return;
    deleteOrphans.mutate(pending.keys, {
      onSettled: () => setPending(null),
    });
  }

  function openAttach(key: string): void {
    setAttachKey(key);
    setAttachTarget(null);
  }

  function requestDelete(key: string): void {
    setPending({
      keys: [key],
      label: key,
    });
  }

  function confirmAttach(): void {
    if (!attachKey || !attachTarget) return;
    attachOrphan.mutate({
      key: attachKey,
      bookmarkId: attachTarget.id,
    }, {
      onSettled: () => {
        setAttachKey(null);
        setAttachTarget(null);
      },
    });
  }

  const attachTargetHasImage = attachTarget?.image != null;
  const hasObjects = registered.length > 0 || orphans.length > 0;

  return (
    <div className="space-y-6">
      <GalleryToolbar
        view={view}
        onViewChange={setView}
        layout={layout}
        onLayoutChange={setLayout}
        scan={scan}
        autoFetch={autoFetch}
        autoFetchRunning={autoFetchRunning}
        pendingAutoFetchCount={catalog?.pendingAutoFetchCount ?? 0}
      />

      {catalog
        ? (
          <StorageSummary
            registered={registered}
            orphans={orphans}
            quotaBytes={catalog.storageQuotaBytes ?? null}
          />
        )
        : null}

      {isLoading ? <p className="text-sm text-muted-foreground">Loading media…</p> : null}
      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

      {catalog && !hasObjects
        ? (
          <p className="text-sm text-muted-foreground">
            No images in storage yet. Upload an image to a bookmark, then run a scan.
          </p>
        )
        : null}

      {hasObjects
        ? (
          <GalleryContent
            view={view}
            layout={layout}
            registered={registered}
            orphans={orphans}
            onDeleteAll={() =>
              setPending({
                keys: orphans.map(object => object.objectKey),
                label: `all ${orphans.length} orphan${orphans.length === 1 ? "" : "s"}`,
              })}
            onAttach={openAttach}
            onDelete={requestDelete}
          />
        )
        : null}

      <GalleryDialogs
        pendingLabel={pending?.label ?? null}
        onCancelDelete={() => setPending(null)}
        onConfirmDelete={confirmDelete}
        deletePending={deleteOrphans.isPending}
        attachOpen={attachKey !== null}
        onCancelAttach={() => setAttachKey(null)}
        bookmarks={allBookmarks}
        attachTarget={attachTarget}
        onSelectTarget={setAttachTarget}
        attachTargetHasImage={attachTargetHasImage}
        onConfirmAttach={confirmAttach}
        attachPending={attachOrphan.isPending}
      />
    </div>
  );
}
