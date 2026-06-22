import type { ImageMode } from "./galleryFormat";
import type { MediaObject } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";

import { formatSize } from "./galleryFormat";
import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";

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
  const usedBytes = [...registered, ...orphans].reduce(
    (sum, obj) => sum + (obj.byteSize ?? 0),
    0,
  );
  return (
    <p className="text-sm text-muted-foreground">
      {`Storage used: ${formatSize(usedBytes)}`}
      {quotaBytes != null ? ` of ${formatSize(quotaBytes)}` : ""}
    </p>
  );
}

/** A thumbnail tile shared by both grids. */
export function Thumb({
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

/** The grid of images still linked to a live bookmark. */
export function RegisteredGrid({
  registered,
  imageMode,
}: { registered: MediaObject[];
  imageMode: ImageMode; }) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  return (
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
  );
}

interface OrphansGridProps {
  orphans: MediaObject[];
  imageMode: ImageMode;
  onDeleteAll: () => void;
  onAttach: (key: string) => void;
  onDelete: (key: string) => void;
}

/** The grid of objects with no live bookmark, plus their reclaim controls. */
export function OrphansGrid({
  orphans,
  imageMode,
  onDeleteAll,
  onAttach,
  onDelete,
}: OrphansGridProps) {
  return (
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
          onClick={onDeleteAll}
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
                  onClick={() => onAttach(object.objectKey)}
                >
                  Attach
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(object.objectKey)}
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
  );
}
