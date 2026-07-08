import type { MediaObject } from "@eesimple/types";
import type { ColumnDef } from "@tanstack/react-table";

import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";

import i18n from "../../i18n";
import { formatSize } from "../galleryFormat";

import { Button } from "@/components/ui/button";

interface GalleryColumnsArgs {
  /** Attach an orphan (by object key) to a bookmark. */
  onAttach: (key: string) => void;
  /** Delete an orphan (by object key). */
  onDelete: (key: string) => void;
}

/**
 * Column definitions for the Media Management table view. One unified table over registered +
 * orphaned objects: a preview, the stored file name, the associated bookmark (or "Orphan"), and the
 * file size. Orphan rows also get Attach / Delete controls so reclaiming works in either view.
 * A plain function (not a hook) so it adds no hook-density to its caller.
 */
export function galleryColumns({
  onAttach,
  onDelete,
}: GalleryColumnsArgs): ColumnDef<MediaObject>[] {
  return [
    {
      id: "preview",
      header: i18n.t("Preview"),
      enableSorting: false,
      cell: ({
        row,
      }) => (
        <img
          src={row.original.url}
          alt=""
          loading="lazy"
          className="
            h-12 w-auto max-w-20 rounded-sm border bg-muted/30 object-contain
          "
        />
      ),
    },
    {
      accessorKey: "objectKey",
      header: i18n.t("Name"),
      cell: ({
        row,
      }) => (
        <span
          className="block max-w-xs truncate font-medium"
          title={row.original.objectKey}
        >
          {row.original.objectKey}
        </span>
      ),
    },
    {
      id: "bookmark",
      header: i18n.t("Bookmark"),
      enableSorting: false,
      cell: ({
        row,
      }) => {
        const bookmark = row.original.bookmark;
        if (!bookmark) {
          return <span className="text-muted-foreground">{i18n.t("Orphan")}</span>;
        }
        return (
          <Link
            to="/bookmarks/$bookmarkId"
            params={{
              bookmarkId: bookmark.id,
            }}
            className="
              wrap-break-word
              hover:underline
            "
            title={bookmark.title}
          >
            {bookmark.title}
          </Link>
        );
      },
    },
    {
      id: "size",
      header: i18n.t("Size"),
      accessorFn: row => row.byteSize ?? 0,
      cell: ({
        row,
      }) => <span className="text-muted-foreground">{formatSize(row.original.byteSize)}</span>,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({
        row,
      }) => {
        if (row.original.bookmark) return null;
        const key = row.original.objectKey;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onAttach(key)}
            >
              {i18n.t("Attach")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(key)}
            >
              <Trash2 className="size-4" />
              {i18n.t("Delete")}
            </Button>
          </div>
        );
      },
    },
  ];
}
