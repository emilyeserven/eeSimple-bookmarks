import type { ImageMode } from "./galleryFormat";
import type { Bookmark } from "@eesimple/types";

import { useState } from "react";

import { Crop, Maximize2, RefreshCw } from "lucide-react";

import { GalleryDialogs } from "./GalleryDialogs";
import { OrphansGrid, RegisteredGrid, StorageSummary } from "./GalleryGrids";
import { useBookmarks } from "../hooks/useBookmarks";
import { useAttachOrphan, useDeleteOrphans, useGallery, useScanBucket } from "../hooks/useGallery";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface GalleryToolbarProps {
  imageMode: ImageMode;
  onImageModeChange: (mode: ImageMode) => void;
  scan: ReturnType<typeof useScanBucket>;
}

function GalleryToolbar({
  imageMode, onImageModeChange, scan,
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

      <ToggleGroup
        type="single"
        value={imageMode}
        onValueChange={value => value && onImageModeChange(value as ImageMode)}
        size="sm"
      >
        <ToggleGroupItem
          value="cover"
          title="Cropped"
        >
          <Crop className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="contain"
          title="Fit"
        >
          <Maximize2 className="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>

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

/**
 * The Gallery: a catalog of every object in the storage bucket, split into images still linked to a
 * bookmark and orphans (objects with no live bookmark) that can be reclaimed. The bucket is
 * reconciled on demand with "Scan bucket".
 */
export function GalleryListing() {
  const {
    data: catalog, isLoading, error,
  } = useGallery();
  const {
    data: allBookmarks = [],
  } = useBookmarks();
  const scan = useScanBucket();
  const deleteOrphans = useDeleteOrphans();
  const attachOrphan = useAttachOrphan();

  const [imageMode, setImageMode] = useState<ImageMode>("cover");

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

  return (
    <div className="space-y-6">
      <GalleryToolbar
        imageMode={imageMode}
        onImageModeChange={setImageMode}
        scan={scan}
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

      {isLoading ? <p className="text-sm text-muted-foreground">Loading gallery…</p> : null}
      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

      {catalog && registered.length === 0 && orphans.length === 0
        ? (
          <p className="text-sm text-muted-foreground">
            No images in storage yet. Upload an image to a bookmark, then run a scan.
          </p>
        )
        : null}

      {registered.length > 0
        ? (
          <RegisteredGrid
            registered={registered}
            imageMode={imageMode}
          />
        )
        : null}

      {orphans.length > 0
        ? (
          <OrphansGrid
            orphans={orphans}
            imageMode={imageMode}
            onDeleteAll={() =>
              setPending({
                keys: orphans.map(object => object.objectKey),
                label: `all ${orphans.length} orphan${orphans.length === 1 ? "" : "s"}`,
              })}
            onAttach={openAttach}
            onDelete={key =>
              setPending({
                keys: [key],
                label: key,
              })}
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
