import type { MediaObject } from "@eesimple/types";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { RefreshCw, Trash2 } from "lucide-react";

import { useDeleteOrphans, useGallery, useScanBucket } from "../hooks/useGallery";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
}: { object: MediaObject }) {
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
        className="size-full object-cover"
      />
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
  const scan = useScanBucket();
  const deleteOrphans = useDeleteOrphans();

  // The pending confirm: one orphan key, or every orphan key for the bulk action.
  const [pending, setPending] = useState<{ keys: string[];
    label: string; } | null>(null);

  const registered = catalog?.registered ?? [];
  const orphans = catalog?.orphans ?? [];

  function confirmDelete(): void {
    if (!pending) return;
    deleteOrphans.mutate(pending.keys, {
      onSettled: () => setPending(null),
    });
  }

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
        {scan.data
          ? (
            <p className="text-sm text-muted-foreground">
              {`Added ${scan.data.added}, updated ${scan.data.updated}, pruned ${scan.data.pruned}.`}
            </p>
          )
          : null}
      </div>

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
                    className="block"
                  >
                    <Thumb object={object} />
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
                Objects with no bookmark — safe to reclaim.
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
                  <Thumb object={object} />
                  <p
                    className="truncate text-xs text-muted-foreground"
                    title={object.objectKey}
                  >
                    {object.objectKey}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{formatSize(object.byteSize)}</span>
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
                </li>
              ))}
            </ul>
          </section>
        )
        : null}

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
    </div>
  );
}
