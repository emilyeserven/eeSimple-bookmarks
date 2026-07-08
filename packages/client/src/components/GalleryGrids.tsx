import type { GalleryLayout } from "./galleryFormat";
import type { Bookmark, InstagramReelArchive, MediaObject } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Download, Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatSize, isVideoObject, layoutContainerClass, layoutItemClass } from "./galleryFormat";
import { useDeleteBookmarkReelArchive } from "../hooks/useBookmarks";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** The storage-used (and optional quota) summary line shown above the grids. */
export function StorageSummary({
  registered,
  orphans,
  quotaBytes,
}: {
  registered: MediaObject[];
  orphans: MediaObject[];
  quotaBytes: number | null;
}) {
  const {
    t,
  } = useTranslation();
  const usedBytes = [...registered, ...orphans].reduce(
    (sum, obj) => sum + (obj.byteSize ?? 0),
    0,
  );
  return (
    <p className="text-sm text-muted-foreground">
      {t("Storage used: {{amount}}", {
        amount: formatSize(usedBytes),
      })}
      {quotaBytes != null
        ? ` ${t("of {{amount}}", {
          amount: formatSize(quotaBytes),
        })}`
        : ""}
    </p>
  );
}

/**
 * A thumbnail tile shared by both grids. In `natural` layout the image keeps its true aspect ratio
 * (it flows in a masonry column); in `square` layout it's cropped to fill a uniform 1:1 box. Video
 * objects (archived reels) render as a muted, controls-less preview instead of an `<img>`.
 */
export function Thumb({
  object,
  layout,
}: { object: MediaObject;
  layout: GalleryLayout; }) {
  const media = isVideoObject(object)
    ? (
      <video
        src={object.url}
        muted
        preload="metadata"
        className={layout === "natural"
          ? "h-auto w-full rounded-md border bg-muted/30"
          : "size-full object-cover"}
      />
    )
    : (
      <img
        src={object.url}
        alt=""
        loading="lazy"
        className={layout === "natural"
          ? "h-auto w-full rounded-md border bg-muted/30"
          : "size-full object-cover"}
      />
    );

  if (layout === "natural") return media;
  return (
    <div
      className="
        flex aspect-square w-full items-center justify-center overflow-hidden
        rounded-md border bg-muted/30
      "
    >
      {media}
    </div>
  );
}

/** The grid of images still linked to a live bookmark. */
export function RegisteredGrid({
  registered,
  layout,
}: { registered: MediaObject[];
  layout: GalleryLayout; }) {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{t("Registered")}</h2>
        <Badge variant="secondary">{registered.length}</Badge>
      </div>
      <ul className={layoutContainerClass(layout)}>
        {registered.map(object => (
          <li
            key={object.objectKey}
            className={layoutItemClass(layout)}
          >
            <Link
              to="/bookmarks/$bookmarkId"
              params={{
                bookmarkId: object.bookmark?.id ?? "",
              }}
              title={object.bookmark?.title}
              className="block"
            >
              <Thumb
                object={object}
                layout={layout}
              />
            </Link>
            <p
              className="text-sm font-medium wrap-break-word"
              title={object.bookmark?.title}
            >
              {object.bookmark?.title}
            </p>
            <p className="text-xs text-muted-foreground">{formatSize(object.byteSize)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface OrphansGridProps {
  orphans: MediaObject[];
  layout: GalleryLayout;
  onDeleteAll: () => void;
  onAttach: (key: string) => void;
  onDelete: (key: string) => void;
}

/** The grid of objects with no live bookmark, plus their reclaim controls. */
export function OrphansGrid({
  orphans,
  layout,
  onDeleteAll,
  onAttach,
  onDelete,
}: OrphansGridProps) {
  const {
    t,
  } = useTranslation();
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{t("Orphans")}</h2>
        <Badge variant="secondary">{orphans.length}</Badge>
        <p className="text-sm text-muted-foreground">
          {t("Objects with no bookmark — attach to a bookmark or reclaim.")}
        </p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="ml-auto"
          onClick={onDeleteAll}
        >
          <Trash2 className="size-4" />
          {t("Delete all orphans")}
        </Button>
      </div>
      <ul className={layoutContainerClass(layout)}>
        {orphans.map(object => (
          <li
            key={object.objectKey}
            className={layoutItemClass(layout)}
          >
            <Thumb
              object={object}
              layout={layout}
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
                {isVideoObject(object)
                  ? null
                  : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onAttach(object.objectKey)}
                    >
                      {t("Attach")}
                    </Button>
                  )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(object.objectKey)}
                >
                  <Trash2 className="size-4" />
                  {t("Delete")}
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The grid of bookmarks with a self-contained archived Instagram reel video. */
export function ArchivedReelsGrid({
  bookmarks,
}: { bookmarks: Bookmark[] }) {
  const {
    t,
  } = useTranslation();
  const remove = useDeleteBookmarkReelArchive();
  const reels = bookmarks.filter(
    (bookmark): bookmark is Bookmark & { reelArchive: InstagramReelArchive } => bookmark.reelArchive !== null,
  );

  if (reels.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("No archived reel videos yet. Archive one from a bookmark's Video edit tab.")}
      </p>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{t("Archived Reels")}</h2>
        <Badge variant="secondary">{reels.length}</Badge>
      </div>
      <ul
        className="
          grid grid-cols-2 gap-3
          sm:grid-cols-3
          lg:grid-cols-4
        "
      >
        {reels.map((bookmark) => {
          const archive = bookmark.reelArchive;
          return (
            <li
              key={bookmark.id}
              className="space-y-1"
            >
              <video
                src={archive.url}
                controls
                preload="metadata"
                className="w-full rounded-md border bg-muted/30"
              />
              <Link
                to="/bookmarks/$bookmarkId"
                params={{
                  bookmarkId: bookmark.id,
                }}
                title={bookmark.title}
                className="
                  block text-sm font-medium wrap-break-word
                  hover:underline
                "
              >
                {bookmark.title}
              </Link>
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs text-muted-foreground">{formatSize(archive.byteSize)}</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("Download archived reel")}
                    title={t("Download archived reel")}
                    asChild
                  >
                    <a
                      href={archive.url}
                      download={`reel-${bookmark.id}.mp4`}
                    >
                      <Download className="size-4" />
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("Remove archived reel")}
                    title={t("Remove archived reel")}
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(bookmark.id)}
                  >
                    {remove.isPending
                      ? <Loader2 className="size-4 animate-spin" />
                      : <Trash2 className="size-4" />}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
