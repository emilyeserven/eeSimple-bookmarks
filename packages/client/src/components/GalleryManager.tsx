import type { Bookmark, MediaObject } from "@eesimple/types";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { Check, Crop, Maximize2, RefreshCw, Trash2 } from "lucide-react";

import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useBookmarks } from "../hooks/useBookmarks";
import { useAttachOrphan, useDeleteOrphans, useGallery, useScanBucket } from "../hooks/useGallery";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

type ImageMode = "cover" | "contain";

/** Human-readable byte size, or a dash when unknown. */
function formatSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/** A thumbnail tile shared by both grids. */
function Thumb({
  object,
  imageMode,
}: { object: MediaObject;
  imageMode: ImageMode; }) {
  return (
    <div
      className="
        flex aspect-square w-full items-center justify-center overflow-hidden
        rounded-md border bg-muted/30
      "
    >
      <img
        src={object.url}
        alt=""
        loading="lazy"
        className={`
          size-full
          ${imageMode === "cover"
      ? "object-cover"
      : "object-contain"}
        `}
      />
    </div>
  );
}

/** Combobox for picking a bookmark to attach an orphan to. */
function BookmarkPicker({
  bookmarks,
  selected,
  onSelect,
}: {
  bookmarks: Bookmark[];
  selected: Bookmark | null;
  onSelect: (bookmark: Bookmark) => void;
}) {
  return (
    <Command className="rounded-lg border shadow-sm">
      <CommandInput placeholder="Search bookmarks…" />
      <CommandList className="max-h-60">
        <CommandEmpty>No bookmarks found.</CommandEmpty>
        <CommandGroup>
          {bookmarks.map(bookmark => (
            <CommandItem
              key={bookmark.id}
              value={bookmark.title}
              onSelect={() => onSelect(bookmark)}
              className="flex items-center justify-between gap-2"
            >
              <span className="truncate">{bookmark.title}</span>
              {selected?.id === bookmark.id
                ? <Check className="size-4 shrink-0 text-primary" />
                : null}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
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
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);

  const [imageMode, setImageMode] = useState<ImageMode>("cover");

  // The pending confirm: one orphan key, or every orphan key for the bulk action.
  const [pending, setPending] = useState<{ keys: string[];
    label: string; } | null>(null);

  // State for the attach dialog.
  const [attachKey, setAttachKey] = useState<string | null>(null);
  const [attachTarget, setAttachTarget] = useState<Bookmark | null>(null);

  const registered = catalog?.registered ?? [];
  const orphans = catalog?.orphans ?? [];

  // Storage summary
  const usedBytes = [...registered, ...orphans].reduce(
    (sum, obj) => sum + (obj.byteSize ?? 0),
    0,
  );
  const quotaBytes = catalog?.storageQuotaBytes ?? null;

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
          onValueChange={value => value && setImageMode(value as ImageMode)}
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

      {catalog
        ? (
          <p className="text-sm text-muted-foreground">
            {`Storage used: ${formatSize(usedBytes)}`}
            {quotaBytes != null ? ` of ${formatSize(quotaBytes)}` : ""}
          </p>
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
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Registered</h2>
              <Badge variant="secondary">{registered.length}</Badge>
            </div>
            <ul
              className="
                grid grid-cols-2 gap-3
                sm:grid-cols-3
                lg:grid-cols-4
              "
            >
              {registered.map(object => (
                <li
                  key={object.objectKey}
                  className="space-y-1"
                >
                  <Link
                    to="/bookmarks/$bookmarkId"
                    params={{
                      bookmarkId: object.bookmark?.id ?? "",
                    }}
                    title={object.bookmark
                      ? `Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`
                      : undefined}
                    onClick={(event) => {
                      const id = object.bookmark?.id;
                      if (id) viewClick(event, "bookmark", id);
                    }}
                    className="block"
                  >
                    <Thumb
                      object={object}
                      imageMode={imageMode}
                    />
                  </Link>
                  <p
                    className="truncate text-sm font-medium"
                    title={object.bookmark?.title}
                  >
                    {object.bookmark?.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatSize(object.byteSize)}</p>
                </li>
              ))}
            </ul>
          </section>
        )
        : null}

      {orphans.length > 0
        ? (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">Orphans</h2>
              <Badge variant="secondary">{orphans.length}</Badge>
              <p className="text-sm text-muted-foreground">
                Objects with no bookmark — attach to a bookmark or reclaim.
              </p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="ml-auto"
                onClick={() =>
                  setPending({
                    keys: orphans.map(object => object.objectKey),
                    label: `all ${orphans.length} orphan${orphans.length === 1 ? "" : "s"}`,
                  })}
              >
                <Trash2 className="size-4" />
                Delete all orphans
              </Button>
            </div>
            <ul
              className="
                grid grid-cols-2 gap-3
                sm:grid-cols-3
                lg:grid-cols-4
              "
            >
              {orphans.map(object => (
                <li
                  key={object.objectKey}
                  className="space-y-1"
                >
                  <Thumb
                    object={object}
                    imageMode={imageMode}
                  />
                  <p
                    className="truncate text-xs text-muted-foreground"
                    title={object.objectKey}
                  >
                    {object.objectKey}
                  </p>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs text-muted-foreground">{formatSize(object.byteSize)}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openAttach(object.objectKey)}
                      >
                        Attach
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setPending({
                            keys: [object.objectKey],
                            label: object.objectKey,
                          })}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )
        : null}

      {/* Delete confirmation dialog */}
      <Dialog
        open={pending !== null}
        onOpenChange={open => !open && setPending(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete orphaned objects?</DialogTitle>
            <DialogDescription>
              {`This permanently deletes ${pending?.label ?? ""} from storage. This can't be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPending(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteOrphans.isPending}
              onClick={confirmDelete}
            >
              {deleteOrphans.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach dialog */}
      <Dialog
        open={attachKey !== null}
        onOpenChange={open => !open && setAttachKey(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach to bookmark</DialogTitle>
            <DialogDescription>
              Choose a bookmark to attach this orphaned image to. This will set (or replace) that
              bookmark&apos;s image.
            </DialogDescription>
          </DialogHeader>

          <BookmarkPicker
            bookmarks={allBookmarks}
            selected={attachTarget}
            onSelect={setAttachTarget}
          />

          {attachTargetHasImage
            ? (
              <p
                className="
                  text-sm text-amber-600
                  dark:text-amber-400
                "
              >
                This bookmark already has an image — it will be replaced.
              </p>
            )
            : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAttachKey(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!attachTarget || attachOrphan.isPending}
              onClick={confirmAttach}
            >
              {attachOrphan.isPending ? "Attaching…" : "Attach"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
